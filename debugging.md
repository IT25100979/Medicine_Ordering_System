The endpoint is returning a 403 Forbidden on the path `/api/health`. Resolve this URL mismatch:

1. Inspect `backend/src/main/java/com/mediorder/controller/HealthController.java`:
   - Standardize the base path. Ensure it responds to BOTH `/api/health` and `/api/v1/health`:
     ```java
     @RestController
     @RequestMapping({"/api/v1", "/api"})
     @CrossOrigin(origins = "*")
     public class HealthController {
         @GetMapping("/health")
         public ResponseEntity<Map<String, String>> healthCheck() {
             return ResponseEntity.ok(Map.of("status", "UP", "service", "MediOrder Backend"));
         }
     }
     ```

2. Update `backend/src/main/java/com/mediorder/config/SecurityConfig.java`:
   - Update `requestMatchers` to permit both paths explicitly, along with wildcard variants:
     ```java
     .requestMatchers(
         "/api/health",
         "/api/v1/health",
         "/api/v1/auth/**",
         "/api/auth/**",
         "/error"
     ).permitAll()
     ```

3. Ensure `http.cors(Customizer.withDefaults())` is explicitly chained in `SecurityFilterChain`.

Apply the code updates directly.