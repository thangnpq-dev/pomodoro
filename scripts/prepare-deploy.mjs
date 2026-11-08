import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const deployDir = path.join(rootDir, 'deploy');

console.log('📦 1. Building client & server...');
execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });

console.log('🧹 2. Preparing deploy directory...');
if (fs.existsSync(deployDir)) {
  fs.rmSync(deployDir, { recursive: true, force: true });
}
fs.mkdirSync(path.join(deployDir, 'client'), { recursive: true });
fs.mkdirSync(path.join(deployDir, 'server', 'dist'), { recursive: true });
fs.mkdirSync(path.join(deployDir, 'server', 'prisma'), { recursive: true });

console.log('📋 3. Copying client build...');
fs.cpSync(path.join(rootDir, 'apps', 'client', 'dist'), path.join(deployDir, 'client'), { recursive: true });

console.log('📋 4. Copying server build & prisma schema...');
fs.cpSync(path.join(rootDir, 'apps', 'server', 'dist'), path.join(deployDir, 'server', 'dist'), { recursive: true });
fs.copyFileSync(
  path.join(rootDir, 'apps', 'server', 'prisma', 'schema.prisma'),
  path.join(deployDir, 'server', 'prisma', 'schema.prisma')
);

// Server package.json standalone (loại bỏ @pomodoro/shared workspace dependency)
const serverPackage = {
  name: "pomodoro-server",
  version: "1.0.0",
  private: true,
  main: "dist/index.js",
  scripts: {
    "start": "node dist/index.js",
    "db:generate": "prisma generate",
    "db:push": "prisma db push"
  },
  dependencies: {
    "@prisma/client": "^6.19.3",
    "bcryptjs": "^3.0.2",
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "express": "^4.21.2",
    "jsonwebtoken": "^9.0.2",
    "prisma": "^6.19.3",
    "zod": "^3.24.2"
  }
};

fs.writeFileSync(
  path.join(deployDir, 'server', 'package.json'),
  JSON.stringify(serverPackage, null, 2)
);

// Server .env.example
const serverEnvExample = `# Cổng Backend lắng nghe (mặc định 4000)
PORT=4000

# Chuỗi kết nối PostgreSQL (Thay user, password, port, db name theo aaPanel của bạn)
DATABASE_URL="postgresql://pomodoro_user:pomodoro_pass@127.0.0.1:5432/pomodoro_db?schema=public"

# Chuỗi bí mật JWT dùng để mã hóa token đăng nhập
JWT_SECRET="pomofocus-jwt-secret-replace-with-your-own-random-string"

# Google OAuth2 Client ID (Nếu dùng đăng nhập Google)
GOOGLE_CLIENT_ID="489244023595-29lvcgda4cvlolkafbt6snjbmtbrsgba.apps.googleusercontent.com"

# Origin của frontend (nếu chạy reverse proxy chung 1 domain thì điền domain đó)
CLIENT_URL="https://pomodoro.yourdomain.com"
`;

fs.writeFileSync(path.join(deployDir, 'server', '.env.example'), serverEnvExample);

// Nginx configuration template for aaPanel
const nginxConf = `# ========================================================
# File mẫu cấu hình Nginx trên aaPanel
# Dán cấu hình này vào: aaPanel -> Website -> [Tên site của bạn] -> Configuration (Config file)
# ========================================================

server {
    listen 80;
    listen 443 ssl http2;
    server_name pomodoro.yourdomain.com; # Thay bằng domain hoặc IP của bạn

    # ĐẢM BẢO đường dẫn này trỏ ĐÚNG vào thư mục chứa file index.html và assets/
    root /www/wwwroot/pomodoro/client;
    index index.html;

    # SSL do aaPanel tự động cấp (Let's Encrypt), giữ nguyên nếu aaPanel tự sinh
    # ssl_certificate ...
    # ssl_certificate_key ...

    # Đảm bảo nạp đầy đủ MIME types và định nghĩa rõ cho JS/PWA Manifest
    include mime.types;
    types {
        application/javascript js mjs;
        application/manifest+json webmanifest;
    }

    # Header cần thiết cho Google OAuth popup (COOP)
    add_header Cross-Origin-Opener-Policy same-origin-allow-popups;

    # 1. Reverse Proxy các API requests tới Backend Node.js
    location /api {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }

    # 2. Xử lý các file tĩnh và gán đúng Content-Type
    location ~* \.m?js$ {
        default_type application/javascript;
        expires 30d;
        access_log off;
    }

    location ~* \.webmanifest$ {
        default_type application/manifest+json;
        expires 30d;
        access_log off;
    }

    location ~* \.(?:ico|css|gif|jpe?g|png|woff2?|eot|ttf|svg|mp3|wav|ogg)$ {
        expires 30d;
        add_header Cache-Control "public, max-age=2592000, immutable";
        access_log off;
    }

    # 3. SPA Routing: Nếu không tìm thấy file, chuyển tiếp về index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
}
`;

fs.writeFileSync(path.join(deployDir, 'nginx.conf'), nginxConf);

// Docker Compose option for aaPanel Docker Manager
const dockerCompose = `version: '3.8'

services:
  db:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_USER: pomodoro_user
      POSTGRES_PASSWORD: pomodoro_password_here
      POSTGRES_DB: pomodoro_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "127.0.0.1:5432:5432"

  server:
    build:
      context: ./server
      dockerfile: Dockerfile
    restart: always
    depends_on:
      - db
    environment:
      PORT: 4000
      DATABASE_URL: "postgresql://pomodoro_user:pomodoro_password_here@db:5432/pomodoro_db?schema=public"
      JWT_SECRET: "pomodoro-super-secret-jwt-key"
      CLIENT_URL: "https://pomodoro.yourdomain.com"
      GOOGLE_CLIENT_ID: "489244023595-29lvcgda4cvlolkafbt6snjbmtbrsgba.apps.googleusercontent.com"
    ports:
      - "127.0.0.1:4000:4000"

volumes:
  postgres_data:
`;

fs.writeFileSync(path.join(deployDir, 'docker-compose.yml'), dockerCompose);

// Server Dockerfile in case user wants docker
const serverDockerfile = `FROM node:20-alpine
WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY prisma ./prisma
RUN npx prisma generate

COPY dist ./dist

EXPOSE 4000
CMD ["sh", "-c", "npx prisma db push && node dist/index.js"]
`;

fs.writeFileSync(path.join(deployDir, 'server', 'Dockerfile'), serverDockerfile);

console.log('🗜️ 5. Creating zip archive for easy upload...');
try {
  execSync('zip -r ../pomodoro-deploy.zip .', { cwd: deployDir, stdio: 'inherit' });
  console.log('✅ Created pomodoro-deploy.zip successfully!');
} catch (e) {
  console.log('ℹ️ zip command skipped or not available.');
}

console.log('🎉 Preparation complete! Files are ready in ./deploy and pomodoro-deploy.zip');
