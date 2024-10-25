# Hướng dẫn sử dụng

## Giới thiệu

Dự án này sử dụng Node.js để xử lý các tác vụ trong game Clickcity. Nó đọc cấu hình proxy và danh sách các ID truy vấn từ các tệp tin và phân phối công việc cho các luồng để xử lý.

![alt text](image.png)

## Cài đặt

1. Cài đặt Node.js từ [trang chủ Node.js](https://nodejs.org/).
2. Tải mã nguồn của dự án về máy tính của bạn.
3. Mở terminal và điều hướng đến thư mục chứa dự án.
4. Chạy lệnh sau để cài đặt các phụ thuộc:

    ```sh
    npm install
    ```

## Cấu hình

- **proxy.txt**: Tệp tin này chứa danh sách các proxy, mỗi proxy trên một dòng theo định dạng URL (ví dụ: `http://username:password@hostname:port`).
- **data.txt**: Tệp tin này chứa danh sách các ID truy vấn, mỗi ID trên một dòng.

## Sử dụng

1. Mở terminal và điều hướng đến thư mục chứa dự án.
2. Chạy lệnh sau để bắt đầu chương trình:

    ```sh
    node index.js
    ```

3. Nhập số lượng luồng (threads) bạn muốn sử dụng để xử lý khi được yêu cầu.
4. Chương trình sẽ bắt đầu xử lý các ID truy vấn và sử dụng các proxy đã cấu hình. Sau khi hoàn thành, nó sẽ đợi 300 giây trước khi bắt đầu lại.

## Ghi chú

- Đảm bảo rằng các tệp tin `proxy.txt` và `data.txt` đã được cấu hình đúng trước khi chạy chương trình.
- Chương trình sẽ tiếp tục chạy và xử lý lại các ID truy vấn sau mỗi 300 giây.

## Tính năng chính

Tool thực hiện các tác vụ chính sau:
- **Đăng nhập**: Tự động đăng nhập tài khoản dựa trên query id.
- **Nâng cấp cấp bậc**: Nâng cấp cấp bậc của người dùng dựa trên số dư tiền mặt.
- **Nhận thưởng hàng ngày**: Nhận thưởng hàng ngày cho người dùng.
- **Gửi câu đố hàng ngày**: Gửi câu đố hàng ngày và nhận thưởng.
- **Nhận mã hàng ngày**: Nhận mã hàng ngày và nhận thưởng.
- **Xử lý nhiệm vụ xã hội**: Xử lý và nhận thưởng từ các nhiệm vụ xã hội.
- **Auto tap để nhận gạch**: Auto tap để nhận gạch.
- **Mua thẻ**: Mua thẻ cho người dùng.
- **Nhận thưởng học viện**: Nhận thưởng từ học viện.

## Liên hệ

Nếu bạn có bất kỳ câu hỏi hoặc gặp vấn đề, vui lòng liên hệ với tôi:
- Tele: [https://t.me/longht2010](https://t.me/longht2010)
- Zalo: 0989320735