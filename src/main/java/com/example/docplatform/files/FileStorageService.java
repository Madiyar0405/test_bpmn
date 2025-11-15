package com.example.docplatform.files;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Clock;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class FileStorageService {

    private final Path storageDirectory;
    private final Clock clock;

    public FileStorageService(@Value("${app.upload-dir:uploads}") String storageDirectory) {
        this(storageDirectory, Clock.systemDefaultZone());
    }

    FileStorageService(String storageDirectory, Clock clock) {
        this(Paths.get(storageDirectory), clock);
    }

    FileStorageService(Path storageDirectory, Clock clock) {
        this.storageDirectory = storageDirectory.toAbsolutePath().normalize();
        this.clock = clock;
        try {
            Files.createDirectories(this.storageDirectory);
        } catch (IOException ex) {
            throw new IllegalStateException("Unable to create storage directory", ex);
        }
    }

    public List<FileInfo> listFiles() {
        try {
            return Files.list(storageDirectory)
                    .filter(Files::isRegularFile)
                    .sorted(Comparator.comparing(this::getLastModifiedSafe).reversed())
                    .map(this::toFileInfo)
                    .collect(Collectors.toList());
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to read stored files", ex);
        }
    }

    public FileInfo store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Файл не выбран или пуст");
        }

        String originalFilename = Objects.requireNonNullElse(file.getOriginalFilename(), "file");
        String sanitizedFilename = StringUtils.cleanPath(originalFilename);
        if (sanitizedFilename.contains("..")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Имя файла содержит недопустимые последовательности");
        }

        String targetFilename = buildTargetFilename(sanitizedFilename);
        Path targetLocation = storageDirectory.resolve(targetFilename).normalize();
        if (!targetLocation.startsWith(storageDirectory)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Недопустимое имя файла");
        }

        try {
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Не удалось сохранить файл", ex);
        }

        return toFileInfo(targetLocation);
    }

    public Resource loadAsResource(String filename) {
        Path filePath = storageDirectory.resolve(filename).normalize();
        if (!filePath.startsWith(storageDirectory)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Недопустимое имя файла");
        }

        try {
            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Файл не найден");
            }
            return resource;
        } catch (MalformedURLException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Ошибка доступа к файлу", ex);
        }
    }

    private String buildTargetFilename(String sanitizedFilename) {
        String timestamp = String.valueOf(Instant.now(clock).toEpochMilli());
        return timestamp + "_" + sanitizedFilename;
    }

    private FileInfo toFileInfo(Path path) {
        try {
            long size = Files.size(path);
            long lastModified = Files.getLastModifiedTime(path).toMillis();
            return new FileInfo(path.getFileName().toString(), size, lastModified);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Не удалось прочитать информацию о файле", ex);
        }
    }

    private long getLastModifiedSafe(Path path) {
        try {
            return Files.getLastModifiedTime(path).toMillis();
        } catch (IOException ex) {
            return 0L;
        }
    }
}
