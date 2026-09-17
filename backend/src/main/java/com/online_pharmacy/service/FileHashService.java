package com.mediorder.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

@Service
public class FileHashService {

    public String generateSha256(MultipartFile file) throws IOException {

        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");

            byte[] fileBytes = file.getBytes();

            byte[] hash = digest.digest(fileBytes);

            return HexFormat.of().formatHex(hash);

        } catch (NoSuchAlgorithmException e) {

            throw new IllegalStateException(
                    "SHA-256 algorithm is not available",
                    e
            );
        }
    }
}