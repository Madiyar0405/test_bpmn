const uploadForm = document.getElementById('upload-form');
const fileInput = document.getElementById('file-input');
const fileNameLabel = document.getElementById('file-name');
const messageBox = document.getElementById('message');
const filesTable = document.getElementById('files-table');
const refreshButton = document.getElementById('refresh-button');

const formatBytes = (bytes) => {
    if (!Number.isFinite(bytes) || bytes < 0) {
        return '—';
    }
    if (bytes === 0) {
        return '0 Б';
    }
    const units = ['Б', 'КБ', 'МБ', 'ГБ'];
    const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const value = bytes / Math.pow(1024, exponent);
    return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
};

const formatDate = (timestamp) => {
    if (!timestamp) {
        return '—';
    }
    return new Intl.DateTimeFormat('ru-RU', {
        dateStyle: 'medium',
        timeStyle: 'short'
    }).format(new Date(timestamp));
};

const renderFiles = (files) => {
    filesTable.innerHTML = '';
    if (!files.length) {
        const emptyRow = document.createElement('tr');
        emptyRow.className = 'empty';
        emptyRow.innerHTML = '<td colspan="4">Файлы пока не загружены.</td>';
        filesTable.appendChild(emptyRow);
        return;
    }

    files.forEach((file) => {
        const row = document.createElement('tr');
        const nameCell = document.createElement('td');
        nameCell.textContent = file.name;

        const sizeCell = document.createElement('td');
        sizeCell.textContent = formatBytes(file.size);

        const dateCell = document.createElement('td');
        dateCell.textContent = formatDate(file.lastModified);

        const actionsCell = document.createElement('td');
        actionsCell.className = 'actions';
        const downloadLink = document.createElement('a');
        downloadLink.href = `/api/files/${encodeURIComponent(file.name)}`;
        downloadLink.className = 'button subtle';
        downloadLink.textContent = 'Скачать';
        actionsCell.appendChild(downloadLink);

        row.appendChild(nameCell);
        row.appendChild(sizeCell);
        row.appendChild(dateCell);
        row.appendChild(actionsCell);
        filesTable.appendChild(row);
    });
};

const loadFiles = async () => {
    try {
        const response = await fetch('/api/files');
        if (!response.ok) {
            throw new Error('Не удалось загрузить список файлов');
        }
        const files = await response.json();
        renderFiles(files);
    } catch (error) {
        setMessage(error.message, true);
    }
};

const setMessage = (text, isError = false) => {
    messageBox.textContent = text;
    messageBox.className = isError ? 'status-error' : 'status-success';
};

uploadForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!fileInput.files.length) {
        setMessage('Выберите файл перед загрузкой', true);
        return;
    }

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    try {
        const response = await fetch('/api/files', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json().catch(() => null);
            const message = error?.message || 'Загрузка не удалась';
            throw new Error(message);
        }

        await loadFiles();
        setMessage('Файл успешно загружен');
        uploadForm.reset();
        fileNameLabel.textContent = 'Файл не выбран';
    } catch (error) {
        setMessage(error.message, true);
    }
});

fileInput.addEventListener('change', () => {
    if (fileInput.files.length) {
        fileNameLabel.textContent = fileInput.files[0].name;
        setMessage('');
    } else {
        fileNameLabel.textContent = 'Файл не выбран';
    }
});

refreshButton.addEventListener('click', loadFiles);

document.addEventListener('DOMContentLoaded', () => {
    loadFiles();
});
