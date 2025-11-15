const uploadForm = document.getElementById('upload-form');
const fileInput = document.getElementById('file-input');
const fileNameLabel = document.getElementById('file-name');
const messageBox = document.getElementById('message');
const filesTable = document.getElementById('files-table');
const refreshButton = document.getElementById('refresh-button');

const documentUploadForm = document.getElementById('document-upload-form');
const documentUploadStatus = document.getElementById('document-upload-status');
const documentUploadResult = document.getElementById('document-upload-result');

const documentsAddressedForm = document.getElementById('documents-addressed-form');
const documentsAddressedStatus = document.getElementById('documents-addressed-status');
const documentsAddressedResult = document.getElementById('documents-addressed-result');

const documentsUploadedForm = document.getElementById('documents-uploaded-form');
const documentsUploadedStatus = document.getElementById('documents-uploaded-status');
const documentsUploadedResult = document.getElementById('documents-uploaded-result');

const documentByNumberForm = document.getElementById('document-by-number-form');
const documentByNumberStatus = document.getElementById('document-by-number-status');
const documentByNumberResult = document.getElementById('document-by-number-result');

const documentAcceptForm = document.getElementById('document-accept-form');
const documentAcceptStatus = document.getElementById('document-accept-status');

const documentRejectForm = document.getElementById('document-reject-form');
const documentRejectStatus = document.getElementById('document-reject-status');

const documentEditForm = document.getElementById('document-edit-form');
const documentEditStatus = document.getElementById('document-edit-status');

const documentAcknowledgeForm = document.getElementById('document-acknowledge-form');
const documentAcknowledgeStatus = document.getElementById('document-acknowledge-status');

const documentsAcknowledgedForm = document.getElementById('documents-acknowledged-form');
const documentsAcknowledgedStatus = document.getElementById('documents-acknowledged-status');
const documentsAcknowledgedResult = document.getElementById('documents-acknowledged-result');

const documentLogsForm = document.getElementById('document-logs-form');
const documentLogsStatus = document.getElementById('document-logs-status');
const documentLogsResult = document.getElementById('document-logs-result');

const setStatus = (element, text = '', state = 'success') => {
    if (!element) {
        return;
    }
    const baseClass = 'status-line';
    const classNames = [baseClass];
    if (state === 'error') {
        classNames.push('status-error');
    } else if (state === 'success' && text) {
        classNames.push('status-success');
    }
    element.className = classNames.join(' ');
    element.textContent = text || '';
};

const setMessage = (text, isError = false) => {
    const state = isError ? 'error' : text ? 'success' : 'info';
    setStatus(messageBox, text, state);
};

const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
}[char] || char));

const readResponse = async (response) => {
    const text = await response.text();
    if (!text) {
        return { json: null, text: '' };
    }
    try {
        return { json: JSON.parse(text), text };
    } catch (error) {
        return { json: null, text };
    }
};

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

const formatTimestamp = (timestamp) => {
    if (!timestamp) {
        return '—';
    }
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
        return '—';
    }
    return new Intl.DateTimeFormat('ru-RU', {
        dateStyle: 'medium',
        timeStyle: 'short'
    }).format(date);
};

const parseDateSafe = (value) => {
    if (!value) {
        return null;
    }
    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDateOnly = (value) => {
    const date = parseDateSafe(value);
    if (!date) {
        return value || '—';
    }
    return new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium' }).format(date);
};

const formatDateTime = (value) => {
    const date = parseDateSafe(value);
    if (!date) {
        return value || '—';
    }
    return new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
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
        dateCell.textContent = formatTimestamp(file.lastModified);

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

const toDocumentView = (document = {}) => ({
    documentNumber: document.documentNumber ?? document.documentNumberNew ?? null,
    documentDate: document.documentDate ?? null,
    documentType: document.documentType?.name ?? document.documentType ?? null,
    status: document.status?.name ?? document.status ?? null,
    uploadDate: document.uploadDate ?? null,
    uploadedByEmail: document.uploadedByEmail ?? document.uploadedBy?.email ?? null,
    addressedToEmail: document.addressedToEmail ?? document.addressedTo?.email ?? null,
    fileName: document.fileName ?? null,
    fileType: document.fileType ?? document.fileExtension ?? null
});

const renderDocumentDetails = (container, document) => {
    if (!container) {
        return;
    }
    container.innerHTML = '';
    if (!document) {
        container.innerHTML = '<p class="muted">Документ не найден.</p>';
        return;
    }

    const view = toDocumentView(document);
    const table = document.createElement('table');
    const tbody = document.createElement('tbody');

    const rows = [
        ['Номер документа', view.documentNumber || '—'],
        ['Дата документа', formatDateOnly(view.documentDate)],
        ['Тип документа', view.documentType || '—'],
        ['Статус', view.status || '—', true],
        ['Email отправителя', view.uploadedByEmail || '—'],
        ['Email получателя', view.addressedToEmail || '—'],
        ['Имя файла', view.fileName || '—'],
        ['Тип файла', view.fileType || '—'],
        ['Дата загрузки', formatDateTime(view.uploadDate)]
    ];

    rows.forEach(([label, value, isStatus]) => {
        const row = document.createElement('tr');
        const header = document.createElement('th');
        header.textContent = label;
        const cell = document.createElement('td');
        if (isStatus && value && value !== '—') {
            const badge = document.createElement('span');
            badge.className = 'tag';
            badge.textContent = value;
            cell.appendChild(badge);
        } else {
            cell.textContent = value;
        }
        row.appendChild(header);
        row.appendChild(cell);
        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    container.appendChild(table);
};

const renderDocumentList = (container, documents = []) => {
    if (!container) {
        return;
    }
    container.innerHTML = '';
    if (!documents.length) {
        container.innerHTML = '<p class="muted">Документы не найдены.</p>';
        return;
    }

    const table = document.createElement('table');
    const thead = document.createElement('thead');
    thead.innerHTML = '<tr><th>Номер</th><th>Дата</th><th>Тип</th><th>Статус</th><th>Отправитель</th><th>Получатель</th><th>Файл</th></tr>';
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    documents.map(toDocumentView).forEach((doc) => {
        const row = document.createElement('tr');
        const values = [
            doc.documentNumber || '—',
            formatDateOnly(doc.documentDate),
            doc.documentType || '—',
            doc.status || '—',
            doc.uploadedByEmail || '—',
            doc.addressedToEmail || '—',
            doc.fileName || '—'
        ];
        values.forEach((value, index) => {
            const cell = document.createElement('td');
            if (index === 3 && value && value !== '—') {
                const badge = document.createElement('span');
                badge.className = 'tag';
                badge.textContent = value;
                cell.appendChild(badge);
            } else {
                cell.textContent = value;
            }
            row.appendChild(cell);
        });
        tbody.appendChild(row);
    });
    table.appendChild(tbody);
    container.appendChild(table);
};

const renderActionLogs = (container, logs = []) => {
    if (!container) {
        return;
    }
    container.innerHTML = '';
    if (!logs.length) {
        container.innerHTML = '<p class="muted">Журнал пуст.</p>';
        return;
    }

    const table = document.createElement('table');
    const thead = document.createElement('thead');
    thead.innerHTML = '<tr><th>Email</th><th>Описание</th><th>Время</th></tr>';
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    logs.forEach((log) => {
        const row = document.createElement('tr');
        const actorCell = document.createElement('td');
        actorCell.textContent = log.actorEmail || '—';
        const descriptionCell = document.createElement('td');
        descriptionCell.textContent = log.description || '—';
        const timestampCell = document.createElement('td');
        timestampCell.textContent = formatDateTime(log.timestamp);
        row.appendChild(actorCell);
        row.appendChild(descriptionCell);
        row.appendChild(timestampCell);
        tbody.appendChild(row);
    });
    table.appendChild(tbody);
    container.appendChild(table);
};

uploadForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!fileInput?.files?.length) {
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
            const { json, text } = await readResponse(response);
            const message = json?.message || text || 'Загрузка не удалась';
            throw new Error(message);
        }

        await loadFiles();
        setMessage('Файл успешно загружен');
        uploadForm.reset();
        if (fileNameLabel) {
            fileNameLabel.textContent = 'Файл не выбран';
        }
    } catch (error) {
        setMessage(error.message, true);
    }
});

fileInput?.addEventListener('change', () => {
    if (!fileNameLabel) {
        return;
    }
    if (fileInput.files.length) {
        fileNameLabel.textContent = fileInput.files[0].name;
        setMessage('');
    } else {
        fileNameLabel.textContent = 'Файл не выбран';
    }
});

refreshButton?.addEventListener('click', loadFiles);

documentUploadForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(documentUploadForm);
    const addressedField = documentUploadForm.querySelector('input[name="addressedToEmail"]');
    if (!addressedField?.value) {
        formData.delete('addressedToEmail');
    }
    documentUploadResult.innerHTML = '';
    setStatus(documentUploadStatus, 'Загружаем документ…', 'info');

    try {
        const response = await fetch('/documents/upload', {
            method: 'POST',
            body: formData
        });
        const { json, text } = await readResponse(response);
        if (!response.ok) {
            const message = json?.message || text || 'Не удалось загрузить документ';
            throw new Error(message);
        }
        setStatus(documentUploadStatus, 'Документ загружен');
        if (json && typeof json === 'object') {
            renderDocumentDetails(documentUploadResult, json);
        } else if (text) {
            documentUploadResult.innerHTML = `<pre>${escapeHtml(text)}</pre>`;
        } else {
            documentUploadResult.innerHTML = '<p class="muted">Сервер не вернул данных.</p>';
        }
        documentUploadForm.reset();
    } catch (error) {
        setStatus(documentUploadStatus, error.message, 'error');
        documentUploadResult.innerHTML = '';
    }
});

documentsAddressedForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(documentsAddressedForm);
    const email = formData.get('email');
    if (!email) {
        return;
    }
    documentsAddressedResult.innerHTML = '';
    setStatus(documentsAddressedStatus, 'Запрашиваем документы…', 'info');
    try {
        const response = await fetch(`/documents/addressedTo/${encodeURIComponent(email)}`);
        const { json, text } = await readResponse(response);
        if (!response.ok) {
            const message = json?.message || text || 'Не удалось получить документы';
            throw new Error(message);
        }
        const documents = Array.isArray(json) ? json : [];
        renderDocumentList(documentsAddressedResult, documents);
        setStatus(documentsAddressedStatus, `Найдено документов: ${documents.length}`);
    } catch (error) {
        setStatus(documentsAddressedStatus, error.message, 'error');
        documentsAddressedResult.innerHTML = '';
    }
});

documentsUploadedForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(documentsUploadedForm);
    const email = formData.get('email');
    if (!email) {
        return;
    }
    documentsUploadedResult.innerHTML = '';
    setStatus(documentsUploadedStatus, 'Запрашиваем документы…', 'info');
    try {
        const response = await fetch(`/documents/uploadedBy/${encodeURIComponent(email)}`);
        const { json, text } = await readResponse(response);
        if (!response.ok) {
            const message = json?.message || text || 'Не удалось получить документы';
            throw new Error(message);
        }
        const documents = Array.isArray(json) ? json : [];
        renderDocumentList(documentsUploadedResult, documents);
        setStatus(documentsUploadedStatus, `Найдено документов: ${documents.length}`);
    } catch (error) {
        setStatus(documentsUploadedStatus, error.message, 'error');
        documentsUploadedResult.innerHTML = '';
    }
});

documentByNumberForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(documentByNumberForm);
    const documentNumber = formData.get('documentNumber');
    if (!documentNumber) {
        return;
    }
    documentByNumberResult.innerHTML = '';
    setStatus(documentByNumberStatus, 'Ищем документ…', 'info');
    try {
        const response = await fetch(`/documents/${encodeURIComponent(documentNumber)}`);
        const { json, text } = await readResponse(response);
        if (!response.ok) {
            const message = json?.message || text || 'Не удалось найти документ';
            throw new Error(message);
        }
        if (json && typeof json === 'object') {
            renderDocumentDetails(documentByNumberResult, json);
            setStatus(documentByNumberStatus, 'Документ найден');
        } else if (text) {
            documentByNumberResult.innerHTML = `<pre>${escapeHtml(text)}</pre>`;
            setStatus(documentByNumberStatus, 'Документ найден');
        } else {
            documentByNumberResult.innerHTML = '<p class="muted">Ответ не содержит данных.</p>';
            setStatus(documentByNumberStatus, 'Документ найден');
        }
    } catch (error) {
        setStatus(documentByNumberStatus, error.message, 'error');
        documentByNumberResult.innerHTML = '';
    }
});

const submitDocumentAction = async (form, statusElement, buildRequest) => {
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const { url, options, successMessage } = buildRequest();
        if (!url) {
            return;
        }
        setStatus(statusElement, 'Выполняем действие…', 'info');
        try {
            const response = await fetch(url, options);
            const { json, text } = await readResponse(response);
            if (!response.ok) {
                const message = json?.message || text || 'Запрос завершился ошибкой';
                throw new Error(message);
            }
            const message = json?.message || json?.status || text || successMessage;
            setStatus(statusElement, message || successMessage || 'Действие выполнено');
            form.reset();
        } catch (error) {
            setStatus(statusElement, error.message, 'error');
        }
    });
};

if (documentAcceptForm && documentAcceptStatus) {
    submitDocumentAction(documentAcceptForm, documentAcceptStatus, () => {
        const formData = new FormData(documentAcceptForm);
        const documentNumber = formData.get('documentNumber');
        const actorEmail = formData.get('actorEmail');
        if (!documentNumber || !actorEmail) {
            return { url: null, options: {}, successMessage: '' };
        }
        const params = new URLSearchParams();
        params.set('actorEmail', actorEmail);
        return {
            url: `/documents/${encodeURIComponent(documentNumber)}/accept`,
            options: {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
                },
                body: params.toString()
            },
            successMessage: 'Документ принят'
        };
    });
}

if (documentRejectForm && documentRejectStatus) {
    submitDocumentAction(documentRejectForm, documentRejectStatus, () => {
        const formData = new FormData(documentRejectForm);
        const documentNumber = formData.get('documentNumber');
        const actorEmail = formData.get('actorEmail');
        if (!documentNumber || !actorEmail) {
            return { url: null, options: {}, successMessage: '' };
        }
        const params = new URLSearchParams();
        params.set('actorEmail', actorEmail);
        return {
            url: `/documents/${encodeURIComponent(documentNumber)}/reject`,
            options: {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
                },
                body: params.toString()
            },
            successMessage: 'Документ отклонён'
        };
    });
}

if (documentEditForm && documentEditStatus) {
    documentEditForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(documentEditForm);
        const currentNumber = formData.get('currentNumber');
        if (!currentNumber) {
            return;
        }
        formData.delete('currentNumber');
        const fileField = documentEditForm.querySelector('input[name="file"]');
        if (!fileField?.files?.length) {
            formData.delete('file');
        }
        setStatus(documentEditStatus, 'Сохраняем изменения…', 'info');
        try {
            const response = await fetch(`/documents/${encodeURIComponent(currentNumber)}/edit`, {
                method: 'POST',
                body: formData
            });
            const { json, text } = await readResponse(response);
            if (!response.ok) {
                const message = json?.message || text || 'Не удалось обновить документ';
                throw new Error(message);
            }
            const message = json?.message || text || 'Документ обновлён';
            setStatus(documentEditStatus, message);
            documentEditForm.reset();
        } catch (error) {
            setStatus(documentEditStatus, error.message, 'error');
        }
    });
}

if (documentAcknowledgeForm && documentAcknowledgeStatus) {
    submitDocumentAction(documentAcknowledgeForm, documentAcknowledgeStatus, () => {
        const formData = new FormData(documentAcknowledgeForm);
        const documentNumber = formData.get('documentNumber');
        const viewerEmail = formData.get('viewerEmail');
        if (!documentNumber || !viewerEmail) {
            return { url: null, options: {}, successMessage: '' };
        }
        const params = new URLSearchParams();
        params.set('viewerEmail', viewerEmail);
        return {
            url: `/documents/${encodeURIComponent(documentNumber)}/acknowledge`,
            options: {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
                },
                body: params.toString()
            },
            successMessage: 'Ознакомление зафиксировано'
        };
    });
}

documentsAcknowledgedForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(documentsAcknowledgedForm);
    const email = formData.get('email');
    if (!email) {
        return;
    }
    documentsAcknowledgedResult.innerHTML = '';
    setStatus(documentsAcknowledgedStatus, 'Запрашиваем документы…', 'info');
    try {
        const params = new URLSearchParams();
        params.set('email', email);
        const response = await fetch(`/documents/acknowledged/by-user?${params.toString()}`);
        const { json, text } = await readResponse(response);
        if (!response.ok) {
            const message = json?.message || text || 'Не удалось получить документы';
            throw new Error(message);
        }
        const documents = Array.isArray(json) ? json : [];
        renderDocumentList(documentsAcknowledgedResult, documents);
        setStatus(documentsAcknowledgedStatus, `Найдено документов: ${documents.length}`);
    } catch (error) {
        setStatus(documentsAcknowledgedStatus, error.message, 'error');
        documentsAcknowledgedResult.innerHTML = '';
    }
});

documentLogsForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(documentLogsForm);
    const documentNumber = formData.get('documentNumber');
    if (!documentNumber) {
        return;
    }
    documentLogsResult.innerHTML = '';
    setStatus(documentLogsStatus, 'Получаем журнал…', 'info');
    try {
        const response = await fetch(`/documents/logs/${encodeURIComponent(documentNumber)}`);
        const { json, text } = await readResponse(response);
        if (!response.ok) {
            const message = json?.message || text || 'Не удалось получить журнал';
            throw new Error(message);
        }
        const logs = Array.isArray(json) ? json : [];
        renderActionLogs(documentLogsResult, logs);
        setStatus(documentLogsStatus, `Записей в журнале: ${logs.length}`);
    } catch (error) {
        setStatus(documentLogsStatus, error.message, 'error');
        documentLogsResult.innerHTML = '';
    }
});

document.addEventListener('DOMContentLoaded', () => {
    loadFiles();
});
