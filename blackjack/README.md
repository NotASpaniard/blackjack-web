# Blackjack (VN)

Một ứng dụng web Blackjack đơn giản chạy thuần HTML/CSS/JS.

## Chạy dự án

- Mở file `index.html` trong trình duyệt, hoặc dùng một static server:

```bash
python3 -m http.server 8080 --directory blackjack
```

Sau đó truy cập `http://localhost:8080`.

## Tính năng hiện có

- Bộ bài 52 lá, xáo ngẫu nhiên.
- Luật cơ bản: chia bài, rút (Hit), dừng (Stand), gấp đôi (Double).
- Tự động xử lý Blackjack tự nhiên (3:2) và bust.
- Quản lý ngân quỹ và cược. Ngân quỹ lưu trong `localStorage`.

## Hướng phát triển

- Lịch sử ván chơi.
- Cấu hình số bộ bài, quy tắc nhà cái (hit soft 17...).
- Hiệu ứng hoạt họa, chip UI đẹp hơn, âm thanh.
- Kết nối database (ví dụ: backend REST/WebSocket) để lưu người dùng, bảng xếp hạng, phiên chơi.
  - Adapter tách biệt để chuyển từ `localStorage` sang API sau này.

## Cấu trúc

- `index.html` – khung HTML và layout
- `styles.css` – giao diện và responsive
- `app.js` – logic Blackjack, vòng chơi và tương tác UI

## Ghi chú

- Trình duyệt hiện đại là đủ, không phụ thuộc build tool.
- Nếu cần deploy tĩnh, chỉ cần phục vụ thư mục `blackjack/`.
