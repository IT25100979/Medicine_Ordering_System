package com.mediorder.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path storageLocation;

    public FileStorageService(
            @Value("${app.file-storage.location:uploads/prescriptions}")
            String storageLocation) {

        this.storageLocation = Paths.get(storageLocation)
                .toAbsolutePath()
                .normalize();

        try {
            Files.createDirectories(this.storageLocation);
        } catch (IOException e) {
            throw new RuntimeException(
                    "Could not create prescription storage directory",
                    e
            );
        }
    }

    public String storeFile(MultipartFile file) throws IOException {

        String originalFilename = StringUtils.cleanPath(
                file.getOriginalFilename()
        );

        String extension = "";

        int dotIndex = originalFilename.lastIndexOf('.');

        if (dotIndex >= 0) {
            extension = originalFilename.substring(dotIndex);
        }

        String filename = UUID.randomUUID() + extension;

        Path targetLocation = storageLocation.resolve(filename);

        Files.copy(file.getInputStream(), targetLocation);

        return targetLocation.toString();
    }
}