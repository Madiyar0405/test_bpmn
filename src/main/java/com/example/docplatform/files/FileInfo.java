package com.example.docplatform.files;

/**
 * Simple projection describing an uploaded file.
 *
 * @param name         stored file name
 * @param size         file size in bytes
 * @param lastModified epoch milliseconds of the last modification
 */
public record FileInfo(String name, long size, long lastModified) {
}
