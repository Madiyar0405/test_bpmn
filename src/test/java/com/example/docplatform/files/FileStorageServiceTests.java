package com.example.docplatform.files;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;

class FileStorageServiceTests {

    @TempDir
    Path tempDir;

    private FileStorageService fileStorageService;

    @BeforeEach
    void setUp() {
        fileStorageService = new FileStorageService(tempDir, Clock.fixed(Instant.parse("2024-01-01T10:15:30Z"), ZoneId.systemDefault()));
    }

    @Test
    void storePersistsFileWithTimestampPrefix() throws IOException {
        MockMultipartFile multipartFile = new MockMultipartFile("file", "test.txt", "text/plain", "Hello".getBytes());

        FileInfo stored = fileStorageService.store(multipartFile);

        Path expectedPath = tempDir.resolve(stored.name());
        assertThat(Files.exists(expectedPath)).isTrue();
        assertThat(Files.readString(expectedPath)).isEqualTo("Hello");
        assertThat(stored.name()).startsWith(String.valueOf(Instant.parse("2024-01-01T10:15:30Z").toEpochMilli()));
    }

    @Test
    void listFilesReturnsStoredEntries() {
        MockMultipartFile multipartFile = new MockMultipartFile("file", "test.txt", "text/plain", "content".getBytes());
        fileStorageService.store(multipartFile);

        List<FileInfo> files = fileStorageService.listFiles();

        assertThat(files).hasSize(1);
        assertThat(files.get(0).name()).contains("test.txt");
    }

    @Test
    void storeRejectsEmptyFile() {
        MockMultipartFile multipartFile = new MockMultipartFile("file", "empty.txt", "text/plain", new byte[0]);

        assertThrows(ResponseStatusException.class, () -> fileStorageService.store(multipartFile));
    }
}
