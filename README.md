# NexHRM – Hệ Thống Quản Lý Nhân Sự & Chấm Công Thông Minh Đa Nền Tảng

Hệ thống hiện đại hóa toàn diện công tác quản trị nhân sự, lịch làm việc, tính lương tự động (C&B) và chấm công thông minh chống gian lận đa tầng. Được thiết kế chuyên biệt cho doanh nghiệp, cơ quan hành chính và tổ chức có nhiều phòng ban, chi nhánh và cơ sở làm việc.

- 🌐 **Live Demo (Cloudflare Pages)**: [https://nexhrm.pages.dev](https://nexhrm.pages.dev)
- 📦 **GitHub Repository**: [https://github.com/trandangkhoilt-arch/REXHRM](https://github.com/trandangkhoilt-arch/REXHRM)
- ⚡ **Cloudflare Project**: `nexhrm` (Cloudflare Pages & Workers)

---

## I. TỔNG QUAN TÍNH NĂNG NỔI BẬT

### 1. Chấm Công Thông Minh Đa Tầng (Smart Time Attendance)
- **Định vị Geofence GPS**: Tính toán khoảng cách trắc địa bằng công thức Haversine trên WGS84, kiểm tra bán kính cơ sở và tiêu chuẩn độ chính xác của cảm biến vị trí (sai số tối đa cho phép).
- **Trạm Chấm Công QR Động (Kiosk Station)**: Màn hình trạm tự động tạo và xoay mã QR mật mã HMAC-SHA256 mỗi 30 giây, chống chụp ảnh màn hình chuyển tiếp hoặc sử dụng lại challenge.
- **Xác Thực Sinh Trắc Học & Liveness**: Tích hợp module kiểm tra trạng thái dịch vụ sinh trắc học sống. Tuyệt đối không giả lập ngẫu nhiên kết quả.
- **Giám Sát Hiện Diện Trong Ca (Presence Verification)**: Hệ thống tự động gửi thử thách xác minh ngẫu nhiên hoặc theo lịch trong ca để đảm bảo nhân viên không check-in rồi bỏ về.
- **Phát Hiện & Cảnh Báo Gian Lận (Attendance Fraud Detection)**: Tự động chấm điểm rủi ro (Risk Score) đối với các trường hợp chấm công ngoài bán kính, QR hết hạn, thiếu check-out hoặc bỏ lỡ xác minh hiện diện.

### 2. Quản Trị Nhân Sự & Cơ Cấu Tổ Chức
- Quản lý 61+ hồ sơ nhân sự chuẩn với mã nhân viên duy nhất (`NEX-xxx`), chức vụ, phòng ban, loại hợp đồng, lương cơ bản và người quản lý trực tiếp.
- Cơ cấu đa cơ sở (Hà Nội HQ, TP. Hồ Chí Minh Branch) và 7 phòng ban chuyên biệt (Ban Giám Đốc, HCNS, Kế toán - Tài chính, CNTT, Kinh doanh, Marketing, Vận hành).
- Nhập/Xuất dữ liệu Excel (.xlsx) và CSV với mã hóa UTF-8 BOM chuẩn tiếng Việt.
- Cơ chế ngừng hoạt động (soft status) bảo toàn dữ liệu lịch sử bảng công và bảng lương.

### 3. Ca Làm Việc & Phân Ca Linh Hoạt
- Hỗ trợ đa dạng loại ca: Ca hành chính, Ca sáng, Ca chiều, **Ca đêm qua đêm (Overnight crossing 00:00)**, Ca linh hoạt (Flex), Ca làm việc từ xa (WFH).
- Thiết lập dung sai đi muộn, về sớm và yêu cầu bảo mật riêng cho từng ca.
- Phân ca linh hoạt cho từng cá nhân, theo phòng ban hoặc phân ca hàng loạt cho cả tháng.

### 4. Bảng Công & Đơn Từ Trực Tuyến
- Bảng công tổng hợp tự động gom ngày công thực tế, số lượt và số phút đi muộn, về sớm, nghỉ phép và giờ làm thêm (OT).
- Khóa bảo mật kỳ công (Lock period) ngăn chặn việc can thiệp trái phép.
- 4 phân hệ đơn từ: Đơn của tôi, Chờ tôi duyệt (phê duyệt đa cấp), Số dư phép năm (tự động khấu trừ ngày phép khi duyệt), Lịch nghỉ lễ công ty.

### 5. Tính Lương Tự Động (C&B Engine)
- Tính toán tiền lương thực tế từ bảng công đã xác nhận.
- Áp dụng chuẩn luật lao động Việt Nam: Khấu trừ BHXH (8%), BHYT (1.5%), BHTN (1%), giảm trừ gia cảnh 11,000,000 VND và biểu thuế lũy tiến từng phần Thuế Thu Nhập Cá Nhân (PIT).
- Phiếu lương điện tử (Payslip) được mã hóa và phân quyền: Nhân viên chỉ xem được phiếu lương cá nhân của mình.

---

## II. DANH SÁCH TÀI KHOẢN MẪU TRẢI NGHIỆM (DEMO ACCOUNTS)

Mật khẩu chung cho tất cả tài khoản quản trị mẫu: **`NexHRM@2026`** (hoặc `123456` cho các tài khoản nhân viên từ 7 đến 61).

| Vai trò (Role) | Email Đăng Nhập | Họ và Tên | Quyền hạn chính |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@nexhrm.vn` | Nguyễn Văn An | Toàn quyền hệ thống, phê duyệt bảng lương, cấu hình tổ chức |
| **HR Admin** | `hr@nexhrm.vn` | Trần Thị Bích | Quản lý nhân viên, phòng ban, ca làm, chốt kỳ bảng công |
| **Manager** | `manager@nexhrm.vn` | Lê Hoàng Nam | Trưởng phòng CNTT, theo dõi lịch, duyệt đơn từ nhân viên cấp dưới |
| **Employee** | `employee@nexhrm.vn` | Phạm Minh Đức | Chấm công vào/ra, gửi đơn từ, xem lịch làm và phiếu lương cá nhân |
| **Payroll (C&B)** | `payroll@nexhrm.vn` | Đỗ Phương Thảo | Chuyên viên tính lương, chạy engine bảng lương, kiểm tra thuế |
| **Auditor** | `auditor@nexhrm.vn` | Vũ Quốc Khánh | Kiểm toán viên, kiểm tra báo cáo, đối soát cảnh báo và Audit Logs |

---

## III. HƯỚNG DẪN CÀI ĐẶT & KHỞI CHẠY HỆ THỐNG

### 1. Yêu cầu môi trường
- Node.js v18+ hoặc v20+
- PostgreSQL v14+ (chạy cục bộ hoặc qua Docker)
- npm hoặc yarn

### 2. Cài đặt các gói phụ thuộc
```bash
npm install
```

### 3. Cấu hình biến môi trường
Sao chép file `.env.example` thành `.env` và điều chỉnh chuỗi kết nối database:
```bash
cp .env.example .env
```
Nội dung file `.env`:
```env
DATABASE_URL="postgresql://macbookpro@localhost:5432/nexhrm_db?schema=public"
JWT_SECRET="nexhrm-jwt-secret-key-production-level-enterprise-encryption-2026"
SESSION_COOKIE_NAME="nexhrm_session"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
QR_SECRET_KEY="nexhrm-station-dynamic-qr-hmac-secret-salt-2026"
LIVENESS_PROVIDER="internal_test"
NODE_ENV="development"
```

### 4. Đồng bộ Database & Sinh dữ liệu mẫu (Seed)
```bash
# Đồng bộ Prisma schema vào PostgreSQL
npx prisma db push

# Khởi tạo 61 nhân sự, lịch làm, dữ liệu chấm công và bảng lương
node prisma/seed.js
```

### 5. Chạy kiểm thử tự động (Unit & Integration Tests)
```bash
npm test
```

### 6. Khởi chạy ứng dụng
```bash
# Môi trường phát triển (Development)
npm run dev

# Hoặc Build & Chạy môi trường sản xuất (Production)
npm run build
npm start
```

Truy cập website tại: **`http://localhost:3000`**

---

## IV. TRIỂN KHAI BẰNG DOCKER & DOCKER COMPOSE

Dự án đã được đóng gói sẵn Dockerfile đa tầng (multi-stage) tối ưu dung lượng:
```bash
# Khởi động toàn bộ cụm dịch vụ gồm Web App và PostgreSQL
docker-compose up -d --build
```
Hệ thống sẽ tự động khởi tạo database container và ứng dụng tại cổng `3000`.

---

## V. CÁC ĐIỂM CHỨC NĂNG THỰC TẾ & BẢO MẬT HỆ THỐNG

1. **Không sử dụng dữ liệu giả (No Mock in Production)**: Mọi dữ liệu nhân sự, tọa độ GPS, thời gian check-in/out, đơn từ và bảng lương đều được đọc/ghi trực tiếp từ cơ sở dữ liệu PostgreSQL thông qua Prisma ORM.
2. **Thời gian Server Timestamp**: Thời điểm ghi nhận chấm công được sinh trực tiếp tại máy chủ theo chuẩn UTC (`new Date()`), ngăn chặn mọi hành vi thay đổi đồng hồ trên điện thoại hoặc máy tính của nhân viên.
3. **Bảo mật phiên đăng nhập**: Sử dụng HTTP-only secure cookies kết hợp JWT có chữ ký số SHA-256, vô hiệu hóa nguy cơ tấn công XSS đánh cắp phiên đăng nhập.
4. **Kiểm tra quyền đa tầng (Backend RBAC)**: Tất cả API nhạy cảm (duyệt đơn, tính lương, khóa kỳ công, sửa nhân viên) đều kiểm tra vai trò tại server, không chỉ ẩn nút ở frontend.
5. **Màn hình Kiosk chuyên dụng**: Đường dẫn `/kiosk` cung cấp giao diện trạm chấm công đặt tại sảnh văn phòng với mã QR xoay vòng liên tục theo thuật toán TOTP/HMAC.
