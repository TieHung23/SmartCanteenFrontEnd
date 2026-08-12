# SMART CANTEEN SYSTEM REQUIREMENT SPECIFICATION (SRS)

## 3. DETAILED SYSTEM SPECIFICATION

---

### 3.2 CUSTOMER / STUDENT APPLICATION (Ứng dụng Sinh viên / Khách hàng)

---

#### 3.2.1 Login Page (`/login`)

- **Function Trigger**: User navigates directly to `/login` or clicks UI Button `"Đăng nhập"` on Header navigation bar.
- **Function Description**: Authenticates Customer/Student via Email/Password or OAuth2 Google authentication.
- **Auth State Check**: If user is already authenticated, automatically redirect to Home page (`/`).
- **Layout & Form Fields**:
  - UI Field `"Email"` (`email`): Text input field (valid email string format).
  - UI Field `"Mật khẩu"` (`password`): Password input field with show/hide password toggle.
  - UI Link `"Quên mật khẩu?"`: Navigates to `/forgot-password`.
- **User Actions & Buttons**:
  - UI Button `"Đăng nhập"`: Submits form data to backend API `/api/Auth/login`. Disabled during request processing (displays UI Label `"Đang đăng nhập..."`).
  - UI Button `"Đăng ký ngay"`: Navigates to `/register`.
  - UI Button `"Tiếp tục với Google"`: Triggers Google OAuth2 authentication flow via `/api/auth/google`.
- **Associated Modals & Drawers**:
  - `GoogleCompleteProfileModal`: Displayed when user logs in via Google for the first time but lacks Phone Number or Student ID.
- **Validation Rules & Business Rules (`LoginSchema`)**:
  - `email`: Required, must follow valid Email Regex format.
  - `password` (`PasswordSchema`): Minimum 8 characters, at least 1 uppercase letter (`A-Z`), 1 digit (`0-9`), and 1 special character (`!@#$%^&*()`).
- **Results & Flow Handling**:
  - **Success (200 OK)**: Store JWT Access Token & Refresh Token, update Zustand store (`useUser`), show UI Toast `"Đăng nhập thành công!"`, redirect to Home page (`/`).
  - **Failure (401 Unauthorized)**: Show UI Toast `"Email hoặc mật khẩu không chính xác."`
  - **Failure (403 Forbidden)**: Returns `errorCode` `"AccountSuspended"` or `"AccountBanned"` → Show UI Toast message with server reason and autoredirect to `/suspended`.

---

#### 3.2.2 Register Page (`/register`)

- **Function Trigger**: User clicks UI Button `"Đăng ký ngay"` on Login page or navigates directly to `/register`.
- **Function Description**: Registers a new student account with personal details and strong password verification.
- **Layout & Form Fields**:
  - UI Field `"Họ và tên"` (`name`): Text input (minimum 2 characters).
  - UI Field `"Email"` (`email`): Text input with email format validation.
  - UI Field `"Mật khẩu"` (`password`): Password input (follows `PasswordSchema`).
  - UI Field `"Xác nhận mật khẩu"` (`confirmPassword`): Password input (must match `password` 100%).
  - UI Field `"Mã sinh viên"` (`studentId`): Optional text input.
  - UI Field `"Ngày sinh"` (`dateOfBirth`): Date picker (User derived age from DOB must be between 10 and 100 years old).
  - UI Field `"Số điện thoại"` (`phoneNumber`): Text input (Vietnamese 10-digit phone regex `/^((\+84)|0)(3|5|7|8|9)+([0-9]{8})$/`).
  - UI Field `"Chuyên ngành / Lớp"` (`majorOrClass`): Optional text input.
  - UI Field `"Địa chỉ"` (`address`): Optional text input.
  - UI Field `"Giới tính"` (`gender`): Select dropdown (`1`: `"Nam"`, `2`: `"Nữ"`, `3`: `"Khác"`).
- **User Actions & Buttons**:
  - UI Button `"Tạo tài khoản"`: Submits form data to `/api/Auth/register`. Disabled while request is pending.
- **Validation Rules & Business Rules (`RegisterSchema`)**:
  - Validates all required inputs using Zod prior to API call. `confirmPassword` must match `password` 100%.
- **Results & Flow Handling**:
  - **Success (201 Created)**: Show UI Toast `"Đăng ký thành công!"` → Autoredirect to `/verify-email`.
  - **Failure (409 Conflict)**: Show UI Toast `"Email đã tồn tại trong hệ thống."`

---

#### 3.2.3 Email Verification Page (`/verify-email`)

- **Function Trigger**: User is redirected from Registration page upon creating a new account or clicks verification link in email.
- **Function Description**: Allows new students to enter the 6-digit OTP code received via email to activate their account.
- **Layout & Form Fields**:
  - UI Field `"Mã OTP"` (`otp`): 6-digit numeric OTP input field.
- **User Actions & Buttons**:
  - UI Button `"Xác nhận OTP"`: Submits code to `/api/Auth/verify-email`.
  - UI Button `"Gửi lại mã OTP"`: Triggers 60-second cooldown timer and calls API to resend verification email.
- **Validation Rules**: `otp` must be exactly 6 numeric digits (`/^\d{6}$/`).
- **Results & Flow Handling**:
  - **Success (200 OK)**: Account verification status updated (`isActive = true`), show UI Toast `"Xác minh Email thành công!"` → Redirect to `/verification` or `/login`.
  - **Failure (400 Bad Request)**: Show UI Toast `"Mã OTP không chính xác hoặc đã hết hạn."`

---

#### 3.2.4 Student Identity Verification Page (`/verification`)

- **Function Trigger**: User navigates to `/verification` from Email Verification page or User Profile page.
- **Function Description**: Allows students to upload proof photos of their official Student ID Card for admin verification and approval.
- **Layout & Form Fields**:
  - UI Dropzone `"Ảnh thẻ sinh viên"` (`studentCardPhoto`): Image file upload input supporting PNG/JPG.
  - UI Status Banner: Displays current verification state (`Pending` - `"Hồ sơ đang được admin/staff xem xét. Bạn sẽ nhận thông báo khi có kết quả."`, `Approved` - `"Đã xác thực thành công!"`, `Rejected` - `"Từ chối (kèm lý do)"`).
- **User Actions & Buttons**:
  - UI Button `"Gửi xác minh sinh viên"`: Uploads image to Cloudinary and submits verification request to `/api/Verification/submit`.
  - UI Button `"Về trang chủ"`: Available when verification is approved, navigates to `/`.
  - UI Button `"Quay lại trang cá nhân"`: Available when verification is approved, navigates to `/profile`.
- **Validation Rules**: Image file size must not exceed 5MB. Must be valid image MIME format.
- **Results & Flow Handling**:
  - **Success (200 OK)**: Submits verification request for admin review → Show UI Toast `"Đã gửi yêu cầu xác minh sinh viên!"`.

---

#### 3.2.5 Forgot Password Page (`/forgot-password`)

- **Function Trigger**: User clicks UI Link `"Quên mật khẩu?"` on Login page or navigates directly to `/forgot-password`.
- **Function Description**: Allows users to enter their registered email address to receive a password reset link and token via email.
- **Layout & Form Fields**:
  - UI Field `"Email"` (`email`): Text input with email format validation.
- **User Actions & Buttons**:
  - UI Button `"Gửi email đặt lại mật khẩu"`: Submits email to `/api/Auth/forgot-password`.
  - UI Link `"Quay lại đăng nhập"`: Navigates back to `/login`.
- **Results & Flow Handling**:
  - **Success (200 OK)**: Sends password reset link via email → Show UI Toast `"Vui lòng kiểm tra hòm thư Email để nhận liên kết đặt lại mật khẩu!"`.
  - **Failure (404 Not Found)**: Show UI Toast `"Email không tồn tại trên hệ thống."`

---

#### 3.2.6 Reset Password Page (`/reset-password`)

- **Function Trigger**: User clicks password reset link containing token in email or navigates to `/reset-password?token=[token]`.
- **Function Description**: Allows unauthenticated users to set a new password securely using a verified reset token received via email (Forgot Password flow).
- **Layout & Form Fields**:
  - UI Field `"Mật khẩu mới"` (`newPassword`): Password input with show/hide toggle.
  - UI Field `"Xác nhận mật khẩu mới"` (`confirmPassword`): Password input with show/hide toggle.
- **User Actions & Buttons**:
  - UI Button `"Đặt lại mật khẩu"`: Submits token and new password to `/api/Auth/reset-password`.
- **Validation Rules & Business Rules (`ResetPasswordSchema`)**:
  - `newPassword` must follow `PasswordSchema` (min 8 chars, 1 uppercase, 1 digit, 1 special char).
  - `confirmPassword` must match `newPassword` 100%.
  - `token` parameter must be present in URL query string.
- **Results & Flow Handling**:
  - **Success (200 OK)**: Password updated successfully → Show UI Toast `"Đặt lại mật khẩu thành công!"` and redirect to `/login`.
  - **Failure (400 Bad Request)**: Show UI Toast `"Mã khôi phục không hợp lệ hoặc đã hết hạn."`

---

#### 3.2.7 Meal Sessions Page (`/session`)

- **Function Trigger**: User clicks UI navigation item `"Phiên ăn"` on top Header navigation bar or accesses `/session`.
- **Function Description**: Displays list of active and upcoming Meal Sessions grouped by date, allowing users to select a date and choose an available meal session to view dishes and place orders.
- **Layout & Elements**:
  - Calendar Date Selector Bar: Horizontal scrollable date bar for selecting dates.
  - Session Cards (Sáng, Trưa, Tối): Displays session name, description, serving time range (`availableFrom` - `availableTo`), order opening window (`availableForOrder`), and meal icon.
  - Status Badges: `"ĐANG MỞ"`, `"SẮP DIỄN RA"`, `"ĐÃ CHỐT"`, `"ĐÃ ĐÓNG"`, `"HẾT HẠN"`.
- **User Actions & Buttons**:
  - Select Date: Filters meal sessions available for the selected calendar date.
  - Click Meal Session Card: Navigates to `/menu?sessionId=[sessionId]` if session is active or available for ordering.
- **Validation Rules & Business Rules**:
  - Expired or finalized sessions (`isFinalized = true` or current time passed `availableTo`) disable card interaction, render UI Badge `"ĐÃ CHỐT"` or `"ĐÃ ĐÓNG"`, and prevent navigation to ordering.
- **Results & Flow Handling**:
  - **Success (200 OK)**: Displays meal sessions list for selected date. Clicking an active session card redirects user to Session Detail & Menu page (`/menu?sessionId=[id]`).
  - **Failure**: No sessions found for selected date → Displays empty state message `"Không có ca ăn nào trong ngày này."`

---

#### 3.2.8 Meal Session Detail & Menu Page (`/menu?sessionId=[id]`)

- **Function Trigger**: User selects an active meal session card from `/session` page or navigates directly to `/menu?sessionId=[id]`.
- **Function Description**: Interactive ordering workspace displaying meal session details, menu template selector, category filters, interactive food tray (drag-and-drop), dish cards grid, dish search, category limit validation, and cart management.
- **Layout & Elements**:
  - Session Header Banner: Displays Session Title, Time Range (`availableFrom` - `availableTo`), Date, and Status badges (`"ĐANG MỞ CHỌN MÓN"`, `"SẮP DIỄN RA"`, `"ĐÃ CHỐT ĐƠN"`).
  - Menu Template Selector: Horizontal template pill carousel (e.g. `"Suất cơm cố định"`, `"Thực đơn tự chọn"`).
  - Interactive Food Tray Workspace: Visual tray view supporting drag-and-drop dish placement, displaying selected item thumbnails and quantities.
  - Category Filter Pills (`Category Pills`): Category tabs (`"Tất cả"`, `"Cơm"`, `"Bún / Phở"`, `"Đồ uống"`, `"Tráng miệng"`) displaying current selected item counts and min/max category constraints (`isRequired`, `minQuantity`, `maxQuantity`).
  - Dish Search Bar: Realtime text search for filtering dishes by title or description.
  - Dish Card Grid: Dish thumbnail, Dish title, Description, Unit price (Canteen Points / Xu), Quantity selected badge (`xN`), and UI Button `"Thêm vào giỏ"`.
  - Floating Cart Button (FAB): Floating shopping cart button displaying current session item count.
- **Associated Modals & Drawers**:
  - `DishDetailModal`: Modal displaying detailed dish nutritional information, calories, allergens, and description.
- **User Actions & Buttons**:
  - Select Template: Switches active meal template rule set.
  - Click `"Thêm vào giỏ"` / Drag to Tray: Checks category rules and stock availability:
    - Valid → Adds dish to cart, updates Zustand store (`useCart`), bounces tray/cart animations, and displays UI Toast `"Đã thêm [tên món] vào giỏ!"`.
    - Exceeded Category Limit → Blocks action and displays UI Toast error `"Danh mục đã đạt giới hạn tối đa"`.
  - Remove / Drag out of Tray: Decrements quantity or removes dish from cart with UI Toast feedback.
  - Click FAB Cart Button: Opens Cart drawer / navigates to `/cart`.
- **Validation Rules & Business Rules**:
  - Block dish selection if session is expired or finalized (`isFinalized = true` or `availableTo` passed).
  - Block dish selection if category `maxQuantity` is reached for the selected template.
  - Disable dish card and show out-of-stock badge if dish `stockQuantity = 0`.

---

#### 3.2.9 Cart Page (`/cart`) & Slide-over Cart Drawer (`CartDrawer`)

- **Function Trigger**: User clicks UI Cart icon on Header or opens cart drawer.
- **Function Description**: Review items added to cart, adjust dish quantities, select target meal session, and check total price.
- **Layout & Form Fields**:
  - UI Checkbox `"Chọn tất cả"` / Individual item checkboxes.
  - Item list: Dish image, Dish title, Unit price, Quantity stepper (`+` / `-`), UI Button `"Xóa"` (Trash icon).
  - UI Summary Box (`Summary Box`): Total price of selected items, UI Button `"Tiến hành thanh toán"`.
- **Associated Modals**:
  - `ConfirmRemoveItemModal`: Confirmation dialog before removing an item from the cart.
- **User Actions & Buttons**:
  - Quantity stepper: Updates item count in Zustand Cart store (`useCart`).
  - UI Button `"Tiến hành thanh toán"`: Navigates to `/checkout` (disabled if no items selected).
- **Results & Flow Handling**:
  - **Success**: Redirects user to Checkout page (`/checkout`).

---

#### 3.2.10 Checkout & Payment Page (`/checkout`)

- **Function Trigger**: User clicks UI Button `"Tiến hành thanh toán"` on Cart page.
- **Function Description**: Select payment method, review order item summary, and create order with pickup credentials.
- **Layout & Form Fields**:
  - Payment Method Selector:
    1. UI Option `"Ví Smart Canteen"` (Displays current available wallet balance).
    2. UI Option `"Cổng VNPAY"`.
    3. UI Option `"Cổng PayOS"`.
- **Associated Modals**:
  - `ConfirmPaymentModal`: Final order placement confirmation modal.
  - `InsufficientBalanceModal`: Displayed when Wallet balance is insufficient, featuring UI Button `"Nạp tiền ngay"`.
- **User Actions & Buttons**:
  - UI Button `"Xác nhận thanh toán"`:
    - If Wallet selected & balance < total amount: Render UI warning error `"Số dư ví không đủ, cần nạp thêm X VNĐ"` + UI Button `"Nạp tiền ngay"`.
    - If VNPAY / PayOS selected: Redirect user to payment gateway URL.
- **Results & Flow Handling**:
  - **Success (200 OK)**: Order created successfully via `/api/Orders`, wallet balance deducted (if Wallet used), generate QR Code & OTP pickup credentials → Autoredirect to `/orders/[id]`.

---

#### 3.2.11 Order History Page (`/orders`)

- **Function Trigger**: User clicks UI navigation item `"Lịch sử đơn hàng"` on Header or navigation bar.
- **Function Description**: Overview dashboard displaying student's order history, summary metrics, status tab filters, date range filter, and text search.
- **Layout & Elements**:
  - Header & Search Bar: Title and realtime search input (filters by Order ID or Session Name).
  - Date Filter Dropdown: Filter by Session Serving Date (`sessionDate`) or Order Placement Date (`created`).
  - Orders Summary Metrics Bar (`OrdersStats`): Displays Total Orders count, Pending orders count, Completed count, and Total Spent Points.
  - Status Tabs Filter (`Tabs`): Filter tabs: `"Tất cả"`, `"Chờ xử lý"` (`0`), `"Đang chuẩn bị"` (`4`), `"Sẵn sàng"` (`1`), `"Hoàn thành"` (`2`), `"Đã hủy"` (`3`), `"Quá hạn"` (`7`).
  - Order Cards List (`OrderCard`): Card view displaying Order ID, Session Name, Created Date, Status Badge, Total Amount, and Quick Action buttons (`"Xem chi tiết"`, `"Yêu cầu hoàn tiền"`).
- **Associated Modals**:
  - `CancelOrderModal`: Confirmation modal to cancel an order (allowed only when status is `Pending`).
- **User Actions & Buttons**:
  - Click Order Card / `"Xem chi tiết"`: Navigates to Order Detail page `/orders/[id]`.
  - Click `"Yêu cầu hoàn tiền"`: Navigates to `/refund?orderId=[id]`.

---

#### 3.2.12 Order Detail & Realtime Tracking Page (`/orders/[id]`)

- **Function Trigger**: User clicks an order item from `/orders` page or is automatically redirected after completing payment at `/checkout`.
- **Function Description**: Detailed realtime tracking workspace displaying order status progress, QR Code & OTP pickup credentials, dish items list, session serving time window, kitchen change proposal resolution, and pickup confirmation.
- **Layout & Elements**:
  - Order Header & Status Badge: Displays Order ID, Created Date, and live status badge (`Pending`, `Preparing`, `ReadyForPickup`, `Completed`, `Cancelled`, `Expired`).
  - Session Info Banner: Displays Session Name, Session Serving Time Range (`availableFrom` - `availableTo`), and Session Date.
  - QR Code & OTP Pickup Credentials Card: **Rendered only when status reaches `ReadyForPickup` (`1`)**, allowing automated pickup at smart canteen slots/counter.
  - Order Items List: Thumbnail, Dish Name, Quantity, Unit Price (Points), Item Status (`OrderItemStatus`), and Change Proposal Action Panel if kitchen issued a substitution proposal.
- **Associated Modals**:
  - `SwapItemModal`: Modal to select an alternative dish from the same session when accepting kitchen proposal.
  - `ConfirmPickupModal`: Confirmation modal when user retrieves meal at slot/counter.
- **User Actions & Buttons**:
  - Click `"Xác nhận đã nhận"`: Sends confirmation to backend when customer retrieves meal, updating status to `Completed` (`2`).
  - Respond to Kitchen Change Proposal:
    - `"Đồng ý đổi món"` (`SwapItem`): Opens `SwapItemModal` to select replacement dish.
    - `"Từ chối đổi món & Hoàn tiền món"` (`RefundItem`): Refunds specific out-of-stock dish value to Smart Canteen Wallet.
    - `"Từ chối đổi món & Hủy toàn bộ đơn"` (`RefundOrder`): Cancels entire order and refunds full amount to Smart Canteen Wallet.

---

#### 3.2.13 Wallet & Topup Page (`/wallet`)

- **Function Trigger**: User clicks UI Wallet balance card on Header or navigates to `/wallet`.
- **Function Description**: Allows students to check available wallet balance, select topup amount presets, and initiate wallet topup via payment gateways (VNPAY / PayOS).
- **Layout & Elements**:
  - Wallet Balance Card: Displays current available balance (in Points / VNĐ).
  - Topup Amount Preset Buttons: `50.000 VNĐ`, `100.000 VNĐ`, `200.000 VNĐ`, `500.000 VNĐ` or custom amount input.
  - Payment Method Selector: Radio selection for `"Cổng VNPAY"` or `"Cổng PayOS"`.
- **User Actions & Buttons**:
  - UI Button `"Nạp tiền vào ví"`: Initiates topup payment gateway request to `/api/Payments/top-up` and redirects user to external gateway URL.
  - UI Button `"Lịch sử giao dịch"`: Navigates to `/wallet/transactions`.

---

#### 3.2.14 Wallet Transaction History Page (`/wallet/transactions`)

- **Function Trigger**: User clicks UI Link `"Lịch sử giao dịch"` on Wallet page or navigates to `/wallet/transactions`.
- **Function Description**: Displays complete audit log of all wallet transactions (Topups, Order payments, Refund credits).
- **Layout & Elements**:
  - Transaction Filter Tabs: `"Tất cả"`, `"Nạp tiền"` (`+`), `"Thanh toán"` (`-`), `"Hoàn tiền"` (`+`).
  - Transaction Items List: Transaction ID, Type, Amount, Description, and Timestamp (`createdAt`). Fetches data from `/api/wallet-transactions`.

---

#### 3.2.15 Refund Request Page (`/refund`)

- **Function Trigger**: User clicks UI Button `"Yêu cầu hoàn tiền"` on Order History or Order Detail page, or accesses `/refund`.
- **Function Description**: Submit a refund claim for item issues or cancellations according to refund policy.
- **Layout & Form Fields**:
  - UI Select `"Chọn đơn hàng"` (`orderId`).
  - UI Select `"Chọn lý do hoàn tiền"` (`policyCode`): `"Sai món ăn"`, `"Thiếu món ăn"`, `"Vấn đề chất lượng thực phẩm"`, `"Lý do khác"`.
  - UI Input `"Mô tả chi tiết"` (`description`).
  - UI Upload `"Tải ảnh minh chứng"` (`proofImages`).
- **User Actions & Buttons**:
  - UI Button `"Gửi yêu cầu hoàn tiền"`: Submits request to `/api/refunds` for manager approval queue.

---

#### 3.2.16 Dish Change Proposals Page (`/change-proposals`, `/notifications`)

- **Function Trigger**: User receives system notification when an ordered dish runs out during tray assembly and kitchen staff issues a substitution proposal.
- **Function Description**: Review replacement dish details and select resolution action.
- **User Actions & Buttons**:
  - UI Action `"Đồng ý đổi món"` (`SwapItem`).
  - UI Action `"Từ chối đổi món & Hoàn tiền món"` (`RefundItem`).
  - UI Action `"Từ chối đổi món & Hủy toàn bộ đơn"` (`RefundOrder`).

---

#### 3.2.17 User Profile & Security Settings Page (`/profile`)

- **Function Trigger**: User selects UI Avatar menu option `"Hồ sơ cá nhân"` or navigates to `/profile`.
- **Function Description**: Manage personal profile information, update avatar, change password in security settings, and upload Student ID card for verification.
- **Tab Navigation Structure (`Tabs`)**:

##### **Tab 1: Personal Info (`Thông tin cá nhân`)**

- **Layout & Form Fields**:
  - UI Field `"Họ và tên"` (`name`), `"Email"` (`email`), `"Số điện thoại"` (`phoneNumber`), `"Mã sinh viên"` (`studentId`), `"Lớp / Chuyên ngành"` (`majorOrClass`).
  - UI Upload `"Ảnh đại diện"` (`avatar`), `"Ảnh thẻ sinh viên"` (`studentCardPhoto`).
- **User Actions & Buttons**:
  - UI Button `"Lưu thay đổi"`: Updates profile info via `/api/Auth/me`.
  - UI Button `"Gửi xác minh sinh viên"`: Submits Student ID photo to `/api/Verification/submit`.

##### **Tab 2: Wallet & Cards (`Ví & Thẻ của tôi`)**

- **Layout & Elements**: Displays current wallet balance summary, linked bank cards, and quick topup shortcut.

##### **Tab 3: Security Settings (`Đổi mật khẩu` / `Cài đặt bảo mật`)**

- **Layout & Form Fields**:
  - Section Header: `"Cài đặt bảo mật"`
  - UI Field `"MẬT KHẨU HIỆN TẠI"` (`currentPassword`): Password input with show/hide toggle.
  - UI Field `"MẬT KHẨU MỚI"` (`newPassword`): Password input with show/hide toggle.
  - UI Field `"XÁC NHẬN MẬT KHẨU"` (`confirmPassword`): Password input with show/hide toggle.
- **User Actions & Buttons**:
  - UI Button `"Cập nhật mật khẩu"`: Submits `currentPassword` and `newPassword` to backend `/api/Auth/change-password`.
- **Validation Rules & Business Rules (`ChangePasswordSchema`)**:
  - `currentPassword`: Required.
  - `newPassword`: Must follow `PasswordSchema` (min 8 chars, 1 uppercase, 1 digit, 1 special char) and must differ from `currentPassword`.
  - `confirmPassword`: Must match `newPassword` 100%.
- **Results & Flow Handling**:
  - **Success (200 OK)**: Password updated successfully → Show UI Toast `"Cập nhật mật khẩu thành công!"` and reset form fields.
  - **Failure (400 Bad Request)**: Show UI Toast `"Mật khẩu hiện tại không chính xác."`

---

### 3.3 MANAGER APPLICATION (Ứng dụng Quản lý Canteen `/manager`)

---

#### 3.3.1 Manager Dashboard Page (`/manager`)

- **Function Trigger**: Canteen Manager authenticates and accesses `/manager`.
- **Function Description**: Highlevel overview dashboard displaying realtime business KPIs, daily revenue, active session stats, tray packing progress, and hardware connectivity telemetry.
- **Layout & Elements**:
  - KPI Cards: Daily Revenue, Total Orders Today, Fulfillment Rate (%), Active Sessions Count.
  - Realtime Order Distribution Chart: Order status pie chart (`Pending`, `Preparing`, `Ready`, `Completed`, `Cancelled`).
  - System Status Bar: Live WebSocket status of Robot Arm, Pickup Slots, and RFID Trays (`"Rảnh"`, `"Bận"`, `"Lỗi"`, `"Bảo trì"`, `"Ngoại tuyến"`).

---

#### 3.3.2 Revenue & Session Reports Page (`/manager/reports`)

- **Function Trigger**: Manager clicks UI Sidebar item `"Báo cáo & Thống kê"` or accesses `/manager/reports`.
- **Function Description**: Analytics workspace for analyzing canteen revenue, peak-hour order volume, and session performance.
- **Associated Modals**:
  - `SessionReportDetailModal`: Modal showing popular dish sales and refund losses for a specific meal session.
- **User Actions & Buttons**:
  - UI Button `"Xuất báo cáo (Excel/PDF)"`: Exports report data.

---

#### 3.3.3 Meal Session Management Page (`/manager/sessions`)

- **Function Trigger**: Manager clicks UI Sidebar item `"Ca phục vụ"` (`/manager/sessions`).
- **Function Description**: Create new sessions, edit active sessions, finalize sessions, and view session calendar.
- **View Modes**: List View / Calendar View (`Session Calendar Heatmap`).
- **Associated Modals**:
  - `CreateSessionModal` / `EditSessionModal`: Modal to create/edit session parameters (`title` - `"Tên ca"`, `availableFrom` - `"Giờ mở bán"`, `availableTo` - `"Giờ đóng ca"`, `availableForOrder` - `"Giờ khóa nhận đơn"`, `finalizationDeadline` - `"Hạn chốt ca"`).
  - `SlotConfigModal`: Modal to assign pickup slots for the session.
- **User Actions & Buttons**:
  - UI Button `"Chốt ca ngay"` (`Finalize Now`): Finalizes meal session. Validates that Category Prepared Quantities meet or exceed total Ordered Quantities.
  - UI Button `"Khóa đơn khẩn cấp"`: Emergency lock preventing new order placements.
  - UI Toggle Button `"Mở rộng tất cả"` / `"Thu gọn tất cả"`: Toggles category dish lists collapse state.

---

#### 3.3.4 Dish Management Page (`/manager/menu`)

- **Function Trigger**: Manager clicks UI Sidebar item `"Quản lý món ăn"` (`/manager/menu`).
- **Function Description**: CRUD operations for menu dishes, pricing, dish descriptions, image upload, and kitchen portion stock management.
- **Associated Modals**:
  - `CreateDishModal` / `EditDishModal`: Form modal for dish details, unit price in points, and Cloudinary image upload.
  - `UpdateStockModal`: Modal for updating kitchen dish portion stock.
- **User Actions & Buttons**:
  - UI Button `"Tạo món mới"`: Opens `CreateDishModal`.
  - UI Button `"Cập nhật tồn kho bếp"` (`UPDATE_STOCK`).
  - UI Toggle Button `"Ẩn / Hiện món ăn"` (`isActive`).

---

#### 3.3.5 Category Management Page (`/manager/categories`)

- **Function Trigger**: Manager clicks UI Sidebar item `"Quản lý danh mục"` (`/manager/categories`).
- **Function Description**: CRUD operations for meal categories (Cơm, Bún/Phở, Đồ uống, Tráng miệng), category icons, display order, and active state.
- **Associated Modals**:
  - `CreateCategoryModal` / `EditCategoryModal`.
  - `ReorderCategoriesModal`: Modal for drag-and-drop reordering of categories.
- **User Actions & Buttons**:
  - UI Button `"Tạo danh mục mới"`.
  - UI Button `"Sắp xếp thứ tự hiển thị"`.

---

#### 3.3.6 Order Management Page (`/manager/orders`)

- **Function Trigger**: Manager clicks UI Sidebar item `"Đơn hàng"` (`/manager/orders`).
- **Function Description**: Search, filter, and inspect customer orders by meal session, student name, or order ID; intervene and update order status when technical errors occur.
- **Associated Modals**:
  - `ManagerOrderDetailModal`: Inspects detailed order timeline and item statuses.
  - `EmergencyCancelOrderModal`: Cancels order and triggers full wallet refund.
- **User Actions & Buttons**:
  - UI Button `"Xem chi tiết đơn"`.
  - UI Button `"Hủy đơn khẩn cấp"`.

---

#### 3.3.7 Refund Requests Approval Page (`/manager/refunds`)

- **Function Trigger**: Manager clicks UI Sidebar item `"Yêu cầu hoàn tiền"` (`/manager/refunds`).
- **Function Description**: Review student refund claims, inspect attached proof images, and approve or reject claims with reason feedback.
- **Associated Modals**:
  - `RefundDetailsModal`: Phóng to ảnh minh chứng và thông tin đơn khiếu nại.
  - `ApproveRefundModal`: Confirms approval → System automatically credits refund amount to student's Smart Canteen Wallet via `/api/manager/refunds/[id]/approve`.
  - `RejectRefundModal`: Requires entering rejection reason `rejectionReason` in UI input via `/api/manager/refunds/[id]/reject`.
- **User Actions & Buttons**:
  - UI Button `"Phê duyệt"`.
  - UI Button `"Từ chối"`.

---

#### 3.3.8 Refund Policy Management Page (`/manager/refund-policies`)

- **Function Trigger**: Manager clicks UI Sidebar item `"Chính sách hoàn tiền"` (`/manager/refund-policies`).
- **Function Description**: Configure automated refund policy rules (% refund rate, proof photo requirements, and policy codes).
- **Associated Modals**:
  - `CreatePolicyModal` (`"Tạo mới chính sách hoàn tiền"`): Modal to create refund policy rule.
  - `EditPolicyModal` (`"Chỉnh sửa chính sách hoàn tiền"`): Modal to edit policy rule.
- **Layout & Form Fields**:
  - UI Field `"Mã chính sách (Code)"`: Uppercase letters, numbers, underscores only (e.g. `SPOILED`, `KHONG_CON_NHU_CAU`).
  - UI Field `"Tên hiển thị (Name)"`: Text input.
  - UI Field `"Mô tả (Description)"`: Textarea.
  - UI Field `"Phần trăm hoàn tiền (%)"`: Numeric input (1 - 100%).
  - UI Toggle `"Yêu cầu hình ảnh minh họa"`: Toggle (`"Có (Bắt buộc tải ảnh)"` / `"Không bắt buộc"`).
- **User Actions & Buttons**:
  - UI Button `"Thêm Chính Sách Mới"`.
  - UI Button `"Tạo chính sách"` / `"Lưu thay đổi"`.
  - UI Action `"Xoá chính sách hoàn tiền này?"`.

---

#### 3.3.9 Robot Arm Management Page (`/manager/robot`)

- **Function Trigger**: Manager clicks UI Sidebar item `"Cánh tay Robot"` (`/manager/robot`).
- **Function Description**: Monitor Robotic Arm operational telemetry, execution speed, error logs, and toggle maintenance modes.
- **Associated Modals**:
  - `ResetRobotModal`: Clears hardware fault flags and re-homes robot arm.
  - `ArmTelemetryLogsModal`: Shows detailed movement coordinate logs.
- **User Actions & Buttons**:
  - UI Toggle Button `"Bật Chế độ bảo trì"`.
  - UI Button `"Reset Robot"`.

---

#### 3.3.10 RFID Tray Management Page (`/manager/trays`)

- **Function Trigger**: Manager clicks UI Sidebar item `"Khay ăn RFID"` (`/manager/trays`).
- **Function Description**: Track physical RFID tray inventory, tray assignment states, and perform bulk tray registration or emergency tray release.
- **Status Badges**: `"Sẵn sàng"` (`Available`), `"Đã giữ chỗ"` (`Reserved`), `"Đang sử dụng"` (`InUse`).
- **Associated Modals**:
  - `TrayDetailModal`: Shows tray details and currently assigned order.
  - `BatchCreateTraysModal`: Bulk registers trays by index range `from` - `to`.
  - `ForceReleaseTrayModal`: Emergency releases stuck tray.
- **User Actions & Buttons**:
  - UI Button `"Thêm khay ăn hàng loạt"`.
  - UI Button `"Giải phóng khay khẩn cấp"`.

---

#### 3.3.11 Pickup Slot Management Page (`/manager/pickup-slots`)

- **Function Trigger**: Manager clicks UI Sidebar item `"Ô lấy món"` (`/manager/pickup-slots`).
- **Function Description**: Monitor physical pickup slot doors, tray occupation status, solenoid lock state, and clear occupied slots manually.
- **Status Badges**: `"Trống"` (`Empty`), `"Đã có khay"` (`Occupied`), `"Đang khóa"` (`Locked`), `"Bảo trì"` (`Maintenance`).
- **Associated Modals**:
  - `ForceClearSlotModal`: Manually clears slot state.
  - `ForceOpenDoorModal`: Manually triggers solenoid door unlock.
- **User Actions & Buttons**:
  - UI Button `"Dọn dẹp ô kệ khẩn cấp"`.
  - UI Button `"Mở cửa ô lấy món khẩn cấp"`.

---

#### 3.3.12 Pickup Slot Mappings Configuration Page (`/manager/slot-configs`)

- **Function Trigger**: Manager clicks UI Sidebar item `"Cấu hình ô kệ"` (`/manager/slot-configs`).
- **Function Description**: Configure spatial coordinates and robot arm motion path mapping coordinates for each pickup slot.
- **Associated Modals**:
  - `EditSlotCoordinatesModal`: Form to update X/Y/Z spatial coordinates.
- **User Actions & Buttons**:
  - UI Button `"Lưu tọa độ ô kệ"`.

---

#### 3.3.13 User Management & Suspension Page (`/manager/users`)

- **Function Trigger**: Manager clicks UI Sidebar item `"Người dùng"` (`/manager/users`).
- **Function Description**: Manage student and staff account list, perform account suspension (`Suspend`), ban (`Ban`), or reactivation (`Reactivate`).
- **Status Badges**: `"Hoạt động"` (`1`), `"Không hoạt động"` (`2`), `"Tạm khóa"` (`4`), `"Cấm tài khoản"` (`5`).
- **Associated Modals**:
  - `UserSuspendModal`: Suspends account with reason via `/api/manager/users/[id]/suspend`.
  - `UserBanModal`: Bans account permanently with reason via `/api/manager/users/[id]/ban`.
  - `ReactivateUserModal`: Reactivates account via `/api/manager/users/[id]/reactivate`.
- **User Actions & Buttons**:
  - UI Button `"Tạm khóa"`.
  - UI Button `"Cấm tài khoản"`.
  - UI Button `"Kích hoạt lại"`.

---

#### 3.3.14 Counter Identity Verification Page (`/manager/verify`)

- **Function Trigger**: Manager clicks UI Sidebar item `"Xác thực tại quầy"` (`/manager/verify`).
- **Function Description**: Search student accounts and manually verify OTP pickup codes or QR Codes at canteen counter during student device battery/network failure.
- **Associated Modals**:
  - `ConfirmCounterPickupModal`: Modal confirming manual counter meal retrieval.
- **User Actions & Buttons**:
  - UI Button `"Xác nhận nhận món tại quầy"`.

---

### 3.4 KITCHEN STAFF APPLICATION (Ứng dụng Nhân viên Bếp `/staff`)

---

#### 3.4.1 Staff Operations Dashboard (`/staff`)

- **Function Trigger**: Kitchen Staff authenticates and navigates to `/staff`.
- **Function Description**: Realtime operational dashboard displaying total portions packed onto trays, live order queue count, and low portion alerts.

---

#### 3.4.2 Live Serving Queue Page (`/staff/live-orders`)

- **Function Trigger**: Staff clicks UI menu `"Hàng chờ soạn khay"` (`/staff/live-orders`).
- **Function Description**: Realtime prioritized queue displaying order dishes to pack onto physical RFID trays.
- **Associated Modals**:
  - `ConfirmTrayPackedModal`: Modal confirming dish tray assembly completion → Triggers Robot Arm dispatch to transport tray to assigned pickup slot.
- **User Actions & Buttons**:
  - UI Button `"Xác nhận đã soạn khay"`.

---

#### 3.4.3 Kitchen Orders List Page (`/staff/orders`)

- **Function Trigger**: Staff clicks UI menu `"Danh sách đơn ca"` (`/staff/orders`).
- **Function Description**: View full history of prepared orders within active meal session and inspect tray assembly timestamps.

---

#### 3.4.4 Dish Stock & Shelf Stock Management Page (`/staff/stock`)

- **Function Trigger**: Staff clicks UI menu `"Tồn kho kệ bếp"` (`/staff/stock`).
- **Function Description**: Rapidly update actual physical dish portion counts remaining on kitchen serving shelves when kitchen replenishes fresh dishes.
- **Layout & Elements**: Grid of active dishes with portion steppers (`-`, `+`).
- **User Actions & Buttons**:
  - UI Button `"Cập nhật tồn kho kệ"`.

---

#### 3.4.5 Change Proposals Management Page (`/staff/change-proposals`)

- **Function Trigger**: Staff clicks UI menu `"Đề xuất đổi món"` (`/staff/change-proposals`).
- **Function Description**: Issue substitution proposals to students when an ordered dish runs out of stock during tray assembly.
- **Associated Modals**:
  - `CreateChangeProposalModal`: Form modal to select out-of-stock item, suggest replacement dish, and set response deadline.
- **User Actions & Buttons**:
  - UI Button `"Tạo đề xuất đổi món"`.

---

#### 3.4.6 Pickup Slot & Station Monitoring Page (`/staff/pickup-slots`)

- **Function Trigger**: Staff clicks UI Sidebar item `"Liên kết ô kệ"` (`/staff/pickup-slots`).
- **Function Description**: Manually bind RFID trays to pickup slots during automated system hardware overrides.
- **Associated Modals**:
  - `ManualBindTrayModal`: Form to select RFID tray and pickup slot number.
- **User Actions & Buttons**:
  - UI Button `"Gán khay vào ô"`.

---

#### 3.4.7 Staff Profile Page (`/staff/profile`)

- **Function Trigger**: Staff clicks UI Sidebar item `"Hồ sơ cá nhân"` (`/staff/profile`).
- **Function Description**: View staff account information, assigned shift details, and trigger account logout (`"Đăng xuất"`).

---

### 3.5 SYSTEM ADMIN APPLICATION (Ứng dụng Quản trị viên `/admin`)

---

#### 3.5.1 Admin Dashboard (`/admin`)

- **Function Trigger**: System Admin authenticates and accesses `/admin`.
- **Function Description**: System health telemetry monitoring dashboard, active user account tally, and pending student verification requests queue.

---

#### 3.5.2 Student Identity Verifications Approval Page (`/admin/verifications`)

- **Function Trigger**: Admin selects UI menu `"Phê duyệt xác minh sinh viên"` (`/admin/verifications`).
- **Function Description**: Inspect uploaded student card photos, match information, and approve or reject verification requests with feedback.
- **Associated Modals**:
  - `ApproveVerificationModal`: Confirms approval via `/api/admin/verifications/[id]/approve`.
  - `RejectVerificationModal`: Requires entering rejection reason feedback via `/api/admin/verifications/[id]/reject`.
- **User Actions & Buttons**:
  - UI Button `"Phê duyệt"`.
  - UI Button `"Từ chối"`.

---

#### 3.5.3 Audit Logs Monitoring Page (`/admin/logs`)

- **Function Trigger**: Admin selects UI menu `"Nhật ký hệ thống"` (`/admin/logs`).
- **Function Description**: Search and inspect system activity audit trail (System Audit Logs via `/api/admin/logs`), robot status logs, wallet topup transactions, and user permission changes.
- **Associated Modals & Drawers**:
  - `LogDetailDrawer`: Slide-over drawer displaying complete raw JSON telemetry payload for a selected log entry (`/api/admin/logs/[id]`).
