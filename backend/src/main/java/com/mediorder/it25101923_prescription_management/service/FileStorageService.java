package com.mediorder.it25101923_prescription_management.service;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${app.upload.dir:${file.upload-dir:uploads/prescriptions}}")
    private String uploadDir;

    private Path fileStorageLocation;

    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList(
            ".pdf", ".jpg", ".jpeg", ".png", ".webp", ".heic"
    );

    private static final long MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

    @PostConstruct
    public void init() {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (IOException ex) {
            throw new RuntimeException("Could not create upload directory at: " + this.fileStorageLocation, ex);
        }
    }

    public void validateFile(MultipartFile file) {
        if(file==null || file.isEmpty()) throw new IllegalArgumentException("Choose a prescription document.");
        if(file.getSize()>MAX_FILE_SIZE_BYTES) throw new IllegalArgumentException("Choose a file smaller than 10 MB.");
        String name=file.getOriginalFilename();
        if(name==null || name.contains("..") || name.contains("/") || name.contains("\\")) throw new IllegalArgumentException("Invalid document filename.");
        String ext=name.substring(Math.max(0,name.lastIndexOf('.'))).toLowerCase(java.util.Locale.ROOT);
        String mime=detectContentType(file);
        boolean valid=switch(ext) {
            case ".pdf" -> mime.equals("application/pdf");
            case ".jpg", ".jpeg" -> mime.equals("image/jpeg");
            case ".png" -> mime.equals("image/png");
            case ".webp" -> mime.equals("image/webp");
            default -> false;
        };
        if(!valid) throw new IllegalArgumentException("Use a valid PDF, JPG, PNG, or WEBP document.");
    }

    public String detectContentType(MultipartFile file) {
        try(java.io.InputStream in=file.getInputStream()) {
            byte[] h=in.readNBytes(12);
            if(h.length>=5 && new String(h,0,5,java.nio.charset.StandardCharsets.US_ASCII).equals("%PDF-")) return "application/pdf";
            if(h.length>=3 && (h[0]&255)==255 && (h[1]&255)==216 && (h[2]&255)==255) return "image/jpeg";
            if(h.length>=8 && java.util.Arrays.equals(java.util.Arrays.copyOf(h,8),new byte[]{(byte)137,80,78,71,13,10,26,10})) return "image/png";
            if(h.length>=12 && new String(h,0,4,java.nio.charset.StandardCharsets.US_ASCII).equals("RIFF") && new String(h,8,4,java.nio.charset.StandardCharsets.US_ASCII).equals("WEBP")) return "image/webp";
            return "application/octet-stream";
        } catch(IOException e) { throw new IllegalArgumentException("Could not read the document.",e); }
    }

    public String storeFile(MultipartFile file) {
        validateFile(file);
        String originalFilename=StringUtils.cleanPath(file.getOriginalFilename());
        int dotIndex=originalFilename.lastIndexOf('.');
        String extension=originalFilename.substring(dotIndex).toLowerCase(java.util.Locale.ROOT);

        String baseName = dotIndex >= 0 ? originalFilename.substring(0, dotIndex) : originalFilename;
        String sanitizedBaseName = baseName.replaceAll("[^a-zA-Z0-9-_]", "_");
        if (sanitizedBaseName.length() > 60) {
            sanitizedBaseName = sanitizedBaseName.substring(0, 60);
        }

        String storedFileName = UUID.randomUUID().toString() + "_" + sanitizedBaseName + extension;

        try {
            Path targetLocation = this.fileStorageLocation.resolve(storedFileName);
            try(java.io.InputStream in=file.getInputStream()) {
                Files.copy(in, targetLocation, StandardCopyOption.REPLACE_EXISTING);
            }
            return storedFileName;
        } catch (IOException ex) {
            throw new RuntimeException("Failed to store file " + storedFileName, ex);
        }
    }

    public Resource loadFileAsResource(String fileName) {
        try {
            Path filePath = this.fileStorageLocation.resolve(fileName).normalize();
            if (!filePath.startsWith(this.fileStorageLocation)) {
                throw new SecurityException("Attempted path traversal attack with filename: " + fileName);
            }
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new RuntimeException("File not found or not readable: " + fileName);
            }
        } catch (MalformedURLException ex) {
            throw new RuntimeException("File not found: " + fileName, ex);
        }
    }

    public boolean deleteFile(String fileName) {
        if (fileName == null || fileName.trim().isEmpty()) {
            return false;
        }
        try {
            Path filePath = this.fileStorageLocation.resolve(fileName).normalize();
            if (!filePath.startsWith(this.fileStorageLocation)) {
                throw new SecurityException("Security violation: path traversal detected: " + fileName);
            }
            return Files.deleteIfExists(filePath);
        } catch (IOException ex) {
            System.err.println("Could not delete file " + fileName + ": " + ex.getMessage());
            return false;
        }
    }

    public boolean fileExists(String fileName) {
        if (fileName == null || fileName.trim().isEmpty()) {
            return false;
        }
        Path filePath = this.fileStorageLocation.resolve(fileName).normalize();
        return Files.exists(filePath);
    }

    public Path getFileStorageLocation() {
        return this.fileStorageLocation;
    }
}

