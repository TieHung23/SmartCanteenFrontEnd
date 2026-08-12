# SMART CANTEEN SYSTEM REQUIREMENT SPECIFICATION (SRS)

## 3. DETAILED SYSTEM SPECIFICATION

---

### 3.2 CUSTOMER / STUDENT APPLICATION (Ứng dụng Sinh viên / Khách hàng)

---

#### 3.2.1 Login Page (`/login`)

Function Trigger
● User navigates directly to `/login`
● User clicks UI Button "Đăng nhập" on Header navigation bar

Function Description
● Authenticates Customer/Student via Email/Password or OAuth2 Google authentication.

Function Details
● Authentication & State Check:
○ If already authenticated → redirect to Home Page (`/`)
○ If errorMsg exists / failed auth → show error message toast
● Form Fields:
○ "Email" (`email`): Text input field (valid email string format)
○ "Mật khẩu" (`password`): Password input field with show/hide password toggle
○ "Quên mật khẩu?" → navigate to `/forgot-password`
● Actions:
○ "Đăng nhập" (disabled while loading "Đang đăng nhập...") → submits form data to `/api/Auth/login`
○ "Đăng ký ngay" → navigate to `/register`
○ "Tiếp tục với Google" → triggers Google OAuth2 authentication flow via `/api/auth/google`
● Associated Modals:
○ `GoogleCompleteProfileModal`: Displayed when user logs in via Google for the first time but lacks Phone Number or Student ID
● Validation Rules (`LoginSchema`):
○ `email`: Required, valid Email Regex format
○ `password` (`PasswordSchema`): Minimum 8 characters, at least 1 uppercase letter (`A-Z`), 1 digit (`0-9`), and 1 special character (`!@#$%^&*()`)
● Result:
○ Success:
■ "Đăng nhập thành công!"
■ Store Access/Refresh Tokens & update Zustand store (`useUser`)
■ Redirect to Home Page (`/`)
○ Fail:
■ 401 → "Email hoặc mật khẩu không chính xác."
■ 403 → Returns `errorCode` "AccountSuspended" or "AccountBanned" → show server reason toast & autoredirect to `/suspended`
■ Other → Show error message toast

Screen Layout
Figure 1 - Login Page

---

#### 3.2.2 Register Page (`/register`)

Function Trigger
● User clicks UI Button "Đăng ký ngay" on Login Page
● User navigates directly to `/register`

Function Description
● Allows students to enter their personal information and create a new account using email/password or register quickly.

Function Details
● Title & Header:
○ "Tạo tài khoản mới / Tham gia cộng đồng Smart Canteen để đặt món ăn nhanh chóng."
● Form Fields:
○ "Họ và tên" (`name`): Text input (minimum 2 characters)
○ "Email" (`email`): Text input with email format validation
○ "Mật khẩu" (`password`): Password input (follows `PasswordSchema`)
○ "Xác nhận mật khẩu" (`confirmPassword`): Password input (must match `password` 100%)
○ "Mã sinh viên" (`studentId`): Optional text input
○ "Ngày sinh" (`dateOfBirth`): Date picker (derived age between 10 and 100 years old)
○ "Số điện thoại" (`phoneNumber`): Text input (Vietnamese 10-digit phone regex `/^((\+84)|0)(3|5|7|8|9)+([0-9]{8})$/`)
○ "Chuyên ngành / Lớp" (`majorOrClass`): Optional text input
○ "Địa chỉ" (`address`): Optional text input
○ "Giới tính" (`gender`): Select dropdown (`1`: "Nam", `2`: "Nữ", `3`: "Khác")
● Actions:
○ "Tạo tài khoản" button (disabled while request is pending) → submits form data to `/api/Auth/register`
○ "Đã có tài khoản? Đăng nhập ngay" → navigate to Login Page (`/login`)
● Validation Rules (`RegisterSchema`):
○ Validates all required inputs using Zod prior to API call. `confirmPassword` must match `password` 100%
● Result:
○ Success:
■ "Đăng ký thành công!"
■ Autoredirect to Email Verification Page (`/verify-email`)
○ Fail:
■ 409 Conflict → "Email đã tồn tại trong hệ thống."
■ Other → Show error message toast

Screen Layout
Figure 2 - Register Page

---

#### 3.2.3 Email Verification Page (`/verify-email`)

Function Trigger
● User is redirected from Registration page upon creating a new account
● User clicks verification link in email or accesses `/verify-email`

Function Description
● Allows new students to enter the 6-digit OTP code received via email to activate their account.

Function Details
● Form Fields:
○ "Mã OTP" (`otp`): 6-digit numeric OTP input field
● Actions:
○ "Xác nhận OTP" button → Submits code to `/api/Auth/verify-email`
○ "Gửi lại mã OTP" button → Triggers 60-second cooldown timer and calls API to resend verification email
● Validation Rules:
○ `otp` must be exactly 6 numeric digits (`/^\d{6}$/`)
● Result:
○ Success:
■ Account verification status updated (`isActive = true`)
■ "Xác minh Email thành công!"
■ Redirect to Student Identity Verification (`/verification`) or Login Page (`/login`)
○ Fail:
■ 400 Bad Request → "Mã OTP không chính xác hoặc đã hết hạn."
■ Other → Show error message toast

Screen Layout
Figure 3 - Email Verification Page

---

#### 3.2.4 Student Identity Verification Page (`/verification`)

Function Trigger
● User navigates to `/verification` from Email Verification Page or User Profile Page

Function Description
● Allows students to upload proof photos of their official Student ID Card for admin verification and approval.

Function Details
● Form Fields & Banners:
○ Dropzone "Ảnh thẻ sinh viên" (`studentCardPhoto`): Image file upload input supporting PNG/JPG
○ UI Status Banner: Displays current verification state (`Pending` - "Hồ sơ đang được admin/staff xem xét. Bạn sẽ nhận thông báo khi có kết quả.", `Approved` - "Đã xác thực thành công!", `Rejected` - "Từ chối (kèm lý do)")
● Actions:
○ "Gửi xác minh sinh viên" button → Uploads image to Cloudinary and submits request to `/api/Verification/submit`
○ "Về trang chủ" button → Available when verification is approved, navigates to `/`
○ "Quay lại trang cá nhân" button → Available when verification is approved, navigates to `/profile`
● Validation Rules:
○ Image file size must not exceed 5MB. Must be valid image MIME format
● Result:
○ Success:
■ Submits verification request for admin review
■ "Đã gửi yêu cầu xác minh sinh viên!"
○ Fail:
■ Show error message toast

Screen Layout
Figure 4 - Student Identity Verification Page

---

#### 3.2.5 Forgot Password Page (`/forgot-password`)

Function Trigger
● User clicks UI Link "Quên mật khẩu?" on Login Page
● User navigates directly to `/forgot-password`

Function Description
● Allows users to request a password reset by entering their registered email address, after which the system sends a reset link to that email.

Function Details
● Title & Header:
○ "Quên Mật Khẩu / Nhập email của bạn để nhận liên kết đặt lại mật khẩu!"
● Form Fields:
○ "Email" (`email`): Text input with email format validation
● Actions:
○ "Gửi email đặt lại mật khẩu" button ("Đang gửi...") → Submits email to `/api/Auth/forgot-password`
○ "Đã có tài khoản? Đăng nhập" → navigate to Login Page (`/login`)
● Result:
○ Success:
■ "Email đã được gửi / Vui lòng kiểm tra email của bạn để đặt lại mật khẩu."
○ Fail:
■ 404 Not Found → "Email không tồn tại trên hệ thống."
■ Other → "Gửi email thất bại"

Screen Layout
Figure 5 - Forgot Password Page

---

#### 3.2.6 Reset Password Page (`/reset-password`)

Function Trigger
● User clicks password reset link containing key/token in email (`/reset-password?token=[token]`)

Function Description
● Allows users to securely set a new password after the system verifies the reset key, completing the password recovery process.

Function Details
● State Verification:
○ If no token: "Link không hợp lệ / Vui lòng kiểm tra email và thử lại." → navigate to Forgot Password Page (`/forgot-password`)
○ Verify token: "Đang xác thực..."
● Title & Header:
○ "Đặt lại mật khẩu / Nhập mật khẩu mới của bạn để đặt lại mật khẩu!"
● Form Fields:
○ "Mật khẩu mới" (`newPassword`): Password input with show/hide toggle
○ "Xác nhận mật khẩu mới" (`confirmPassword`): Password input with show/hide toggle
● Actions:
○ "Đặt lại mật khẩu" button → Submits token and new password to `/api/Auth/reset-password`
○ "Đã có tài khoản? Đăng nhập" → navigate to Login Page (`/login`)
● Validation Rules (`ResetPasswordSchema`):
○ `newPassword` must follow `PasswordSchema` (min 8 chars, 1 uppercase, 1 digit, 1 special char)
○ `confirmPassword` must match `newPassword` 100%
○ `token` parameter must be present in URL query string
● Result:
○ Success:
■ "Đặt lại mật khẩu thành công / Bạn có thể đăng nhập với mật khẩu mới."
■ Redirect to Login Page (`/login`)
○ Fail:
■ 400 Bad Request → "Mã khôi phục không hợp lệ hoặc đã hết hạn."
■ Other → "Đặt lại mật khẩu thất bại"

Screen Layout
Figure 6 - Reset Password Page

---

#### 3.2.7 Meal Sessions Page (`/session`)

Function Trigger
● User clicks UI navigation item "Phiên ăn" on top Header navigation bar or accesses `/session`

Function Description
● Allows students to browse all active and upcoming Meal Sessions grouped by date, with date filtering and session status visibility.

Function Details
● Elements & Filters:
○ Calendar Date Selector Bar: Horizontal scrollable date bar for selecting calendar dates
○ Session Cards (Sáng, Trưa, Tối): Displays session title, description, serving time range (`availableFrom` - `availableTo`), order opening window (`availableForOrder`), and meal icon
○ Status Badges: "ĐANG MỞ", "SẮP DIỄN RA", "ĐÃ CHỐT", "ĐÃ ĐÓNG", "HẾT HẠN"
● Actions:
○ Select Date: Filters meal sessions available for the selected calendar date
○ Click Meal Session Card: Navigates to `/menu?sessionId=[sessionId]` if session is active or available for ordering
● Validation Rules:
○ Expired or finalized sessions (`isFinalized = true` or current time passed `availableTo`) disable card interaction, render UI Badge "ĐÃ CHỐT" or "ĐÃ ĐÓNG", and prevent navigation to ordering
● Result:
○ Success:
■ Displays meal sessions list for selected date
■ Clicking an active session card redirects user to Session Detail & Menu Page (`/menu?sessionId=[id]`)
○ Fail / Empty:
■ No sessions found for selected date → Displays empty state message "Không có ca ăn nào trong ngày này."

Screen Layout
Figure 7 - Meal Sessions Page

---

#### 3.2.8 Meal Session Detail & Menu Page (`/menu?sessionId=[id]`)

Function Trigger
● User selects an active meal session card from `/session` page or navigates directly to `/menu?sessionId=[id]`

Function Description
● Allows students to view full session menu info, select template rules, filter categories, view food tray, and add dishes to cart.

Function Details
● Elements & Workspace:
○ Session Header Banner: Displays Session Title, Time Range (`availableFrom` - `availableTo`), Date, and Status badges ("ĐANG MỞ CHỌN MÓN", "SẮP DIỄN RA", "ĐÃ CHỐT ĐƠN")
○ Menu Template Selector: Horizontal template pill carousel (e.g. "Suất cơm cố định", "Thực đơn tự chọn")
○ Interactive Food Tray Workspace: Visual tray view supporting drag-and-drop dish placement, displaying selected item thumbnails and quantities
○ Category Filter Pills (`Category Pills`): Category tabs ("Tất cả", "Cơm", "Bún / Phở", "Đồ uống", "Tráng miệng") displaying current selected item counts and min/max category constraints (`isRequired`, `minQuantity`, `maxQuantity`)
○ Dish Search Bar: Realtime text search for filtering dishes by title or description
○ Dish Card Grid: Dish thumbnail, Dish title, Description, Unit price (Canteen Points / Xu), Quantity selected badge (`xN`), and UI Button "Thêm vào giỏ"
○ Floating Cart Button (FAB): Floating shopping cart button displaying current session item count
● Associated Modals:
○ `DishDetailModal`: Modal displaying detailed dish nutritional information, calories, allergens, and description
● Actions:
○ Select Template: Switches active meal template rule set
○ Click "Thêm vào giỏ" / Drag to Tray: Checks category rules and stock availability:
■ Valid → Adds dish to cart, updates Zustand store (`useCart`), bounces tray/cart animations, and displays UI Toast "Đã thêm [tên món] vào giỏ!"
■ Exceeded Category Limit → Blocks action and displays UI Toast error "Danh mục đã đạt giới hạn tối đa"
○ Remove / Drag out of Tray: Decrements quantity or removes dish from cart with UI Toast feedback
○ Click FAB Cart Button: Opens Cart drawer / navigates to `/cart`
● Validation & Business Rules:
○ Block dish selection if session is expired or finalized (`isFinalized = true` or `availableTo` passed)
○ Block dish selection if category `maxQuantity` is reached for the selected template
○ Disable dish card and show out-of-stock badge if dish `stockQuantity = 0`

Screen Layout
Figure 8 - Meal Session Detail & Menu Page

---

#### 3.2.9 Cart Page (`/cart`) & Slide-over Cart Drawer (`CartDrawer`)

Function Trigger
● User navigates to Cart Page via header cart icon or opens Cart drawer

Function Description
● Allows students to review, select, adjust quantities, and remove courses/dishes from cart before proceeding to checkout.

Function Details
● Layout & Panels:
○ Left panel — course/dish list:
■ Header: "Món ăn / Khóa học" + "Chọn tất cả" toggle checkbox. Checking selects all
■ Each row: individual checkbox, thumbnail, title, category/level, price, quantity stepper (`+` / `-`)
■ Trash button → removes the dish from the cart
○ Right panel — order summary:
■ Summary Box: "Đã chọn" + total price of selected items
■ "Tiến hành thanh toán" button: disabled when no items are selected
● Associated Modals:
○ `ConfirmRemoveItemModal`: Confirmation dialog before removing an item from the cart
● Actions:
○ Toggle Checkbox: Selects / deselects items for checkout
○ Quantity Stepper: Updates item count in Zustand Cart store (`useCart`)
○ Trash button: Removes dish from cart
■ Success → Toast success "Đã xóa khỏi giỏ hàng."
■ Error → Toast error "Không thể xóa khỏi giỏ hàng."
○ "Tiến hành thanh toán" button → Navigates to `/checkout` with selected items
● Result:
○ Success: Redirects user to Checkout page (`/checkout`)

Screen Layout
Figure 9 - Cart Page & Cart Drawer

---

#### 3.2.10 Checkout & Payment Page (`/checkout`)

Function Trigger
● User accesses the checkout page through either a direct purchase action or cart-based checkout action

Function Description
● Allows students to review selected dishes/courses, choose payment method, and complete purchase.

Function Details
● Layout & Panels:
○ Left panel:
■ Items list: thumbnail, title, category, quantity, price
■ Remove item: click "Trash" icon → remove from list
■ Payment method selector: - VNPAY: "Thanh toán qua ứng dụng ngân hàng hoặc thẻ ATM" - PayOS: "Hệ thống thanh toán nhanh chóng, bảo mật cao" - Wallet: "Thanh toán bằng số dư ví Smart Canteen - Tức thì"
○ Right panel:
■ "Tạm tính" + Total amount
■ Wallet Info (if Wallet selected): displays current balance; if balance < total amount → highlights warning error "Số dư không đủ / Cần thêm X VNĐ" + UI Button "Nạp tiền ngay"
■ "Thanh toán ngay" / "Xác nhận thanh toán" button
● Associated Modals:
○ `ConfirmPaymentModal`: Final order placement confirmation modal
○ `InsufficientBalanceModal`: Displayed when Wallet balance is insufficient, featuring UI Button "Nạp tiền ngay"
● Actions & Result:
○ Wallet Payment:
■ Success (200 OK) → Order created via `/api/Orders`, wallet balance deducted, QR Code & OTP generated → Autoredirect to Order Detail Page (`/orders/[id]`)
○ VNPAY / PayOS:
■ Redirects to external payment gateway URL
○ Fail:
■ Show error message "Không thể tạo đơn hàng"

Screen Layout
Figure 10 - Checkout & Payment Page

---

#### 3.2.11 Order History Page (`/orders`)

Function Trigger
● User navigates to Order History Page via navbar header navigation item "Lịch sử đơn hàng"

Function Description
● Overview dashboard displaying student's order history, summary metrics, status tab filters, date range filter, and text search.

Function Details
● Layout & Elements:
○ Header & Search Bar: Title and realtime search input (filters by Order ID or Session Name)
○ Date Filter Dropdown: Filter by Session Serving Date (`sessionDate`) or Order Placement Date (`created`)
○ Orders Summary Metrics Bar (`OrdersStats`): Displays Total Orders count, Pending orders count, Completed count, and Total Spent Points
○ Status Tabs Filter (`Tabs`): Filter tabs: "Tất cả", "Chờ xử lý" (`0`), "Đang chuẩn bị" (`4`), "Sẵn sàng" (`1`), "Hoàn thành" (`2`), "Đã hủy" (`3`), "Quá hạn" (`7`)
○ Order Cards List (`OrderCard`): Card view displaying Order ID, Session Name, Created Date, Status Badge, Total Amount, and Quick Action buttons ("Xem chi tiết", "Yêu cầu hoàn tiền")
● Associated Modals:
○ `CancelOrderModal`: Confirmation modal to cancel an order (allowed only when status is `Pending`)
● Actions:
○ Click Order Card / "Xem chi tiết" → Navigates to Order Detail page `/orders/[id]`
○ Click "Yêu cầu hoàn tiền" → Navigates to `/refund?orderId=[id]`
○ Click "Hủy đơn hàng" → Opens `CancelOrderModal`

Screen Layout
Figure 11 - Order History Page

---

#### 3.2.12 Order Detail & Realtime Tracking Page (`/orders/[id]`)

Function Trigger
● User clicks an order item from `/orders` page or is automatically redirected after completing payment at `/checkout`

Function Description
● Detailed realtime tracking workspace displaying order status progress, QR Code & OTP pickup credentials, dish items list, session serving time window, kitchen change proposal resolution, and pickup confirmation.

Function Details
● Layout & Elements:
○ Order Header & Status Badge: Displays Order ID, Created Date, and live status badge (`Pending`, `Preparing`, `ReadyForPickup`, `Completed`, `Cancelled`, `Expired`)
○ Session Info Banner: Displays Session Name, Session Serving Time Range (`availableFrom` - `availableTo`), and Session Date
○ QR Code & OTP Pickup Credentials Card: Rendered only when status reaches `ReadyForPickup` (`1`), allowing automated pickup at smart canteen slots/counter
○ Order Items List: Thumbnail, Dish Name, Quantity, Unit Price (Points), Item Status (`OrderItemStatus`), and Change Proposal Action Panel if kitchen issued a substitution proposal
● Associated Modals:
○ `SwapItemModal`: Modal to select an alternative dish from the same session when accepting kitchen proposal
○ `ConfirmPickupModal`: Confirmation modal when user retrieves meal at slot/counter
● Actions:
○ Click "Xác nhận đã nhận" → Sends confirmation to backend when customer retrieves meal, updating status to `Completed` (`2`)
○ Respond to Kitchen Change Proposal:
■ "Đồng ý đổi món" (`SwapItem`) → Opens `SwapItemModal` to select replacement dish
■ "Từ chối đổi món & Hoàn tiền món" (`RefundItem`) → Refunds specific out-of-stock dish value to Smart Canteen Wallet
■ "Từ chối đổi món & Hủy toàn bộ đơn" (`RefundOrder`) → Cancels entire order and refunds full amount to Smart Canteen Wallet

Screen Layout
Figure 12 - Order Detail Page

---

#### 3.2.13 Wallet & Topup Page (`/wallet`)

Function Trigger
● User clicks UI Wallet balance card on Header or navigates to `/wallet`

Function Description
● Allows students to check available wallet balance, select topup amount presets, and initiate wallet topup via payment gateways.

Function Details
● Layout & Elements:
○ Wallet Balance Card: Displays current available balance (in Points / VNĐ)
○ Topup Amount Preset Buttons: `50.000 VNĐ`, `100.000 VNĐ`, `200.000 VNĐ`, `500.000 VNĐ` or custom amount input
○ Payment Method Selector: Radio selection for "Cổng VNPAY" or "Cổng PayOS"
● Actions:
○ UI Button "Nạp tiền vào ví" → Initiates topup payment gateway request to `/api/Payments/top-up` and redirects user to external gateway URL
○ UI Button "Lịch sử giao dịch" → Navigates to `/wallet/transactions`
● Result:
○ Success: Redirects to payment gateway URL
○ Failure: Show UI Toast error "Không thể tạo giao dịch nạp tiền."

Screen Layout
Figure 13 - Wallet & Topup Page

---

#### 3.2.14 Wallet Transaction History Page (`/wallet/transactions`)

Function Trigger
● User clicks UI Link "Lịch sử giao dịch" on Wallet page or navigates to `/wallet/transactions`

Function Description
● Displays complete audit log of all wallet transactions (Topups, Order payments, Refund credits).

Function Details
● Layout & Elements:
○ Transaction Filter Tabs: "Tất cả", "Nạp tiền" (`+`), "Thanh toán" (`-`), "Hoàn tiền" (`+`)
○ Transaction Items List: Transaction ID, Type, Amount, Description, and Timestamp (`createdAt`). Fetches data from `/api/wallet-transactions`
● Result:
○ Success: Displays paginated audit log of wallet transactions

Screen Layout
Figure 14 - Wallet Transaction History Page

---

#### 3.2.15 Refund Request Page (`/refund`)

Function Trigger
● User clicks UI Button "Yêu cầu hoàn tiền" on Order History or Order Detail page, or accesses `/refund`

Function Description
● Submit a refund claim for item issues or cancellations according to refund policy.

Function Details
● Layout & Form Fields:
○ Select "Chọn đơn hàng" (`orderId`)
○ Select "Chọn lý do hoàn tiền" (`policyCode`): "Sai món ăn", "Thiếu món ăn", "Vấn đề chất lượng thực phẩm", "Lý do khác"
○ Input "Mô tả chi tiết" (`description`)
○ Upload "Tải ảnh minh chứng" (`proofImages`)
● Actions:
○ UI Button "Gửi yêu cầu hoàn tiền" → Submits request to `/api/refunds` for manager approval queue
● Result:
○ Success: Show UI Toast "Đã gửi yêu cầu hoàn tiền thành công!" → Redirect to `/orders`
○ Failure: Show UI Toast "Gửi yêu cầu hoàn tiền thất bại."

Screen Layout
Figure 15 - Refund Request Page

---

#### 3.2.16 Dish Change Proposals Page (`/change-proposals`, `/notifications`)

Function Trigger
● User receives system notification when an ordered dish runs out during tray assembly and kitchen staff issues a substitution proposal

Function Description
● Review replacement dish details and select resolution action.

Function Details
● Layout & Action Panels:
○ Proposal Header: Out-of-stock dish name, suggested replacement dish, price difference, and response deadline
● Actions:
○ UI Action "Đồng ý đổi món" (`SwapItem`) → Opens replacement dish confirmation
○ UI Action "Từ chối đổi món & Hoàn tiền món" (`RefundItem`) → Credits dish value back to wallet
○ UI Action "Từ chối đổi món & Hủy toàn bộ đơn" (`RefundOrder`) → Cancels order and refunds full amount

Screen Layout
Figure 16 - Dish Change Proposals Page

---

#### 3.2.17 User Profile & Security Settings Page (`/profile`)

Function Trigger
● User selects UI Avatar menu option "Hồ sơ cá nhân" or navigates to `/profile`

Function Description
● Manage personal profile information, update avatar, change password in security settings, and upload Student ID card for verification.

Function Details
● Tab Navigation Structure (`Tabs`):
○ Tab 1: Personal Info (`Thông tin cá nhân`)
■ Layout: "Họ và tên" (`name`), "Email" (`email`), "Số điện thoại" (`phoneNumber`), "Mã sinh viên" (`studentId`), "Lớp / Chuyên ngành" (`majorOrClass`)
■ Upload: "Ảnh đại diện" (`avatar`), "Ảnh thẻ sinh viên" (`studentCardPhoto`)
■ Actions: "Lưu thay đổi" (updates profile info via `/api/Auth/me`), "Gửi xác minh sinh viên" (submits ID photo to `/api/Verification/submit`)
○ Tab 2: Wallet & Cards (`Ví & Thẻ của tôi`)
■ Layout: Displays current wallet balance summary, linked bank cards, and quick topup shortcut
○ Tab 3: Security Settings (`Đổi mật khẩu` / `Cài đặt bảo mật`)
■ Layout: "MẬT KHẨU HIỆN TẠI" (`currentPassword`), "MẬT KHẨU MỚI" (`newPassword`), "XÁC NHẬN MẬT KHẨU" (`confirmPassword`)
■ Actions: "Cập nhật mật khẩu" (submits to `/api/Auth/change-password`)
■ Validation (`ChangePasswordSchema`): `currentPassword` required; `newPassword` follows `PasswordSchema` and differs from current; `confirmPassword` matches 100%
■ Result: Success → "Cập nhật mật khẩu thành công!"; Failure → "Mật khẩu hiện tại không chính xác."

Screen Layout
Figure 17 - User Profile & Security Settings Page

---

### 3.3 MANAGER APPLICATION (Ứng dụng Quản lý Canteen `/manager`)

---

#### 3.3.1 Manager Dashboard Page (`/manager`)

Function Trigger
● Canteen Manager authenticates and accesses `/manager`

Function Description
● High-level overview dashboard displaying realtime business KPIs, daily revenue, active session stats, tray packing progress, and hardware connectivity telemetry.

Function Details
● Layout & Telemetry:
○ KPI Cards: Daily Revenue, Total Orders Today, Fulfillment Rate (%), Active Sessions Count
○ Realtime Order Distribution Chart: Order status pie chart (`Pending`, `Preparing`, `Ready`, `Completed`, `Cancelled`)
○ System Status Bar: Live WebSocket status of Robot Arm, Pickup Slots, and RFID Trays ("Rảnh", "Bận", "Lỗi", "Bảo trì", "Ngoại tuyến")
● Actions:
○ Navigation shortcuts to manage sessions, dishes, orders, and hardware devices

Screen Layout
Figure 18 - Manager Dashboard Page

---

#### 3.3.2 Revenue & Session Reports Page (`/manager/reports`)

Function Trigger
● Manager clicks UI Sidebar item "Báo cáo & Thống kê" or accesses `/manager/reports`

Function Description
● Analytics workspace for analyzing canteen revenue, peak-hour order volume, and session performance.

Function Details
● Elements & Metrics:
○ Revenue chart breakdown by date, session, and dish category
○ Sales volume summary metrics
● Associated Modals:
○ `SessionReportDetailModal`: Modal showing popular dish sales and refund losses for a specific meal session
● Actions:
○ UI Button "Xuất báo cáo (Excel/PDF)" → Exports report data file

Screen Layout
Figure 19 - Revenue & Session Reports Page

---

#### 3.3.3 Meal Session Management Page (`/manager/sessions`)

Function Trigger
● Manager clicks UI Sidebar item "Ca phục vụ" (`/manager/sessions`)

Function Description
● Create new sessions, edit active sessions, finalize sessions, and view session calendar.

Function Details
● View Modes:
○ List View / Calendar View (`Session Calendar Heatmap`)
● Associated Modals:
○ `CreateSessionModal` / `EditSessionModal`: Modal to create/edit session parameters (`title` - "Tên ca", `availableFrom` - "Giờ mở bán", `availableTo` - "Giờ đóng ca", `availableForOrder` - "Giờ khóa nhận đơn", `finalizationDeadline` - "Hạn chốt ca")
○ `SlotConfigModal`: Modal to assign pickup slots for the session
● Actions:
○ UI Button "Chốt ca ngay" (`Finalize Now`): Finalizes meal session. Validates that Category Prepared Quantities meet or exceed total Ordered Quantities
○ UI Button "Khóa đơn khẩn cấp": Emergency lock preventing new order placements
○ UI Toggle Button "Mở rộng tất cả" / "Thu gọn tất cả": Toggles category dish lists collapse state

Screen Layout
Figure 20 - Meal Session Management Page

---

#### 3.3.4 Dish Management Page (`/manager/menu`)

Function Trigger
● Manager clicks UI Sidebar item "Quản lý món ăn" (`/manager/menu`)

Function Description
● CRUD operations for menu dishes, pricing, dish descriptions, image upload, and kitchen portion stock management.

Function Details
● Layout & Dish Grid:
○ Dish table/grid displaying image, title, category, unit price (Points), stock, and active status
● Associated Modals:
○ `CreateDishModal` / `EditDishModal`: Form modal for dish details, unit price in points, and Cloudinary image upload
○ `UpdateStockModal`: Modal for updating kitchen dish portion stock
● Actions:
○ UI Button "Tạo món mới" → Opens `CreateDishModal`
○ UI Button "Cập nhật tồn kho bếp" (`UPDATE_STOCK`)
○ UI Toggle Button "Ẩn / Hiện món ăn" (`isActive`)

Screen Layout
Figure 21 - Dish Management Page

---

#### 3.3.5 Category Management Page (`/manager/categories`)

Function Trigger
● Manager clicks UI Sidebar item "Quản lý danh mục" (`/manager/categories`)

Function Description
● CRUD operations for meal categories (Cơm, Bún/Phở, Đồ uống, Tráng miệng), category icons, display order, and active state.

Function Details
● Layout & Order List:
○ Category list with name, icon, display order, item count, and status
● Associated Modals:
○ `CreateCategoryModal` / `EditCategoryModal`
○ `ReorderCategoriesModal`: Modal for drag-and-drop reordering of categories
● Actions:
○ UI Button "Tạo danh mục mới"
○ UI Button "Sắp xếp thứ tự hiển thị"

Screen Layout
Figure 22 - Category Management Page

---

#### 3.3.6 Order Management Page (`/manager/orders`)

Function Trigger
● Manager clicks UI Sidebar item "Đơn hàng" (`/manager/orders`)

Function Description
● Search, filter, and inspect customer orders by meal session, student name, or order ID; intervene and update order status when technical errors occur.

Function Details
● Layout & Order Table:
○ Search bar, session filter, status tabs, and order rows
● Associated Modals:
○ `ManagerOrderDetailModal`: Inspects detailed order timeline and item statuses
○ `EmergencyCancelOrderModal`: Cancels order and triggers full wallet refund
● Actions:
○ UI Button "Xem chi tiết đơn"
○ UI Button "Hủy đơn khẩn cấp"

Screen Layout
Figure 23 - Order Management Page

---

#### 3.3.7 Refund Requests Approval Page (`/manager/refunds`)

Function Trigger
● Manager clicks UI Sidebar item "Yêu cầu hoàn tiền" (`/manager/refunds`)

Function Description
● Review student refund claims, inspect attached proof images, and approve or reject claims with reason feedback.

Function Details
● Layout & Claim Cards:
○ Refund claim list displaying order ID, student name, policy code, description, proof images, and status
● Associated Modals:
○ `RefundDetailsModal`: Zoom proof images and claim details
○ `ApproveRefundModal`: Confirms approval → System automatically credits refund amount to student's Smart Canteen Wallet via `/api/manager/refunds/[id]/approve`
○ `RejectRefundModal`: Requires entering rejection reason `rejectionReason` in UI input via `/api/manager/refunds/[id]/reject`
● Actions:
○ UI Button "Phê duyệt"
○ UI Button "Từ chối"

Screen Layout
Figure 24 - Refund Requests Approval Page

---

#### 3.3.8 Refund Policy Management Page (`/manager/refund-policies`)

Function Trigger
● Manager clicks UI Sidebar item "Chính sách hoàn tiền" (`/manager/refund-policies`)

Function Description
● Configure automated refund policy rules (% refund rate, proof photo requirements, and policy codes).

Function Details
● Form Fields & Table:
○ UI Field "Mã chính sách (Code)": Uppercase letters, numbers, underscores only (e.g. `SPOILED`, `KHONG_CON_NHU_CAU`)
○ UI Field "Tên hiển thị (Name)": Text input
○ UI Field "Mô tả (Description)": Textarea
○ UI Field "Phần trăm hoàn tiền (%)": Numeric input (1 - 100%)
○ UI Toggle "Yêu cầu hình ảnh minh họa": Toggle ("Có (Bắt buộc tải ảnh)" / "Không bắt buộc")
● Associated Modals:
○ `CreatePolicyModal` ("Tạo mới chính sách hoàn tiền"): Modal to create refund policy rule
○ `EditPolicyModal` ("Chỉnh sửa chính sách hoàn tiền"): Modal to edit policy rule
● Actions:
○ UI Button "Thêm Chính Sách Mới"
○ UI Button "Tạo chính sách" / "Lưu thay đổi"
○ UI Action "Xoá chính sách hoàn tiền này?"

Screen Layout
Figure 25 - Refund Policy Management Page

---

#### 3.3.9 Robot Arm Management Page (`/manager/robot`)

Function Trigger
● Manager clicks UI Sidebar item "Cánh tay Robot" (`/manager/robot`)

Function Description
● Monitor Robotic Arm operational telemetry, execution speed, error logs, and toggle maintenance modes.

Function Details
● Layout & Controls:
○ Status indicators, operational state, motion speed controls, and hardware error codes
● Associated Modals:
○ `ResetRobotModal`: Clears hardware fault flags and re-homes robot arm
○ `ArmTelemetryLogsModal`: Shows detailed movement coordinate logs
● Actions:
○ UI Toggle Button "Bật Chế độ bảo trì"
○ UI Button "Reset Robot"

Screen Layout
Figure 26 - Robot Arm Management Page

---

#### 3.3.10 RFID Tray Management Page (`/manager/trays`)

Function Trigger
● Manager clicks UI Sidebar item "Khay ăn RFID" (`/manager/trays`)

Function Description
● Track physical RFID tray inventory, tray assignment states, and perform bulk tray registration or emergency tray release.

Function Details
● Status Badges:
○ "Sẵn sàng" (`Available`), "Đã giữ chỗ" (`Reserved`), "Đang sử dụng" (`InUse`)
● Associated Modals:
○ `TrayDetailModal`: Shows tray details and currently assigned order
○ `BatchCreateTraysModal`: Bulk registers trays by index range `from` - `to`
○ `ForceReleaseTrayModal`: Emergency releases stuck tray
● Actions:
○ UI Button "Thêm khay ăn hàng loạt"
○ UI Button "Giải phóng khay khẩn cấp"

Screen Layout
Figure 27 - RFID Tray Management Page

---

#### 3.3.11 Pickup Slot Management Page (`/manager/pickup-slots`)

Function Trigger
● Manager clicks UI Sidebar item "Ô lấy món" (`/manager/pickup-slots`)

Function Description
● Monitor physical pickup slot doors, tray occupation status, solenoid lock state, and clear occupied slots manually.

Function Details
● Status Badges:
○ "Trống" (`Empty`), "Đã có khay" (`Occupied`), "Đang khóa" (`Locked`), "Bảo trì" (`Maintenance`)
● Associated Modals:
○ `ForceClearSlotModal`: Manually clears slot state
○ `ForceOpenDoorModal`: Manually triggers solenoid door unlock
● Actions:
○ UI Button "Dọn dẹp ô kệ khẩn cấp"
○ UI Button "Mở cửa ô lấy món khẩn cấp"

Screen Layout
Figure 28 - Pickup Slot Management Page

---

#### 3.3.12 Pickup Slot Mappings Configuration Page (`/manager/slot-configs`)

Function Trigger
● Manager clicks UI Sidebar item "Cấu hình ô kệ" (`/manager/slot-configs`)

Function Description
● Configure spatial coordinates and robot arm motion path mapping coordinates for each pickup slot.

Function Details
● Layout & Matrix:
○ Pickup slot coordinate table listing X/Y/Z parameters and trajectory mapping IDs
● Associated Modals:
○ `EditSlotCoordinatesModal`: Form to update X/Y/Z spatial coordinates
● Actions:
○ UI Button "Lưu tọa độ ô kệ"

Screen Layout
Figure 29 - Pickup Slot Mappings Configuration Page

---

#### 3.3.13 User Management & Suspension Page (`/manager/users`)

Function Trigger
● Manager clicks UI Sidebar item "Người dùng" (`/manager/users`)

Function Description
● Manage student and staff account list, perform account suspension (`Suspend`), ban (`Ban`), or reactivation (`Reactivate`).

Function Details
● Status Badges:
○ "Hoạt động" (`1`), "Không hoạt động" (`2`), "Tạm khóa" (`4`), "Cấm tài khoản" (`5`)
● Associated Modals:
○ `UserSuspendModal`: Suspends account with reason via `/api/manager/users/[id]/suspend`
○ `UserBanModal`: Bans account permanently with reason via `/api/manager/users/[id]/ban`
○ `ReactivateUserModal`: Reactivates account via `/api/manager/users/[id]/reactivate`
● Actions:
○ UI Button "Tạm khóa"
○ UI Button "Cấm tài khoản"
○ UI Button "Kích hoạt lại"

Screen Layout
Figure 30 - User Management & Suspension Page

---

#### 3.3.14 Counter Identity Verification Page (`/manager/verify`)

Function Trigger
● Manager clicks UI Sidebar item "Xác thực tại quầy" (`/manager/verify`)

Function Description
● Search student accounts and manually verify OTP pickup codes or QR Codes at canteen counter during student device battery/network failure.

Function Details
● Layout & Form:
○ Search input (Student ID / Order OTP / Phone number)
○ Matching order credentials preview card
● Associated Modals:
○ `ConfirmCounterPickupModal`: Modal confirming manual counter meal retrieval
● Actions:
○ UI Button "Xác nhận nhận món tại quầy"

Screen Layout
Figure 31 - Counter Identity Verification Page

---

### 3.4 KITCHEN STAFF APPLICATION (Ứng dụng Nhân viên Bếp `/staff`)

---

#### 3.4.1 Staff Operations Dashboard (`/staff`)

Function Trigger
● Kitchen Staff authenticates and navigates to `/staff`

Function Description
● Realtime operational dashboard displaying total portions packed onto trays, live order queue count, and low portion alerts.

Function Details
● Layout & Metrics:
○ Portion counter summary cards, station status alerts, and shift metrics banner

Screen Layout
Figure 32 - Staff Operations Dashboard

---

#### 3.4.2 Live Serving Queue Page (`/staff/live-orders`)

Function Trigger
● Staff clicks UI menu "Hàng chờ soạn khay" (`/staff/live-orders`)

Function Description
● Realtime prioritized queue displaying order dishes to pack onto physical RFID trays.

Function Details
● Layout & Queue Items:
○ Order ticket card showing ordered dishes, assigned RFID tray ID, target slot, and assembly timer
● Associated Modals:
○ `ConfirmTrayPackedModal`: Modal confirming dish tray assembly completion → Triggers Robot Arm dispatch to transport tray to assigned pickup slot
● Actions:
○ UI Button "Xác nhận đã soạn khay"

Screen Layout
Figure 33 - Live Serving Queue Page

---

#### 3.4.3 Kitchen Orders List Page (`/staff/orders`)

Function Trigger
● Staff clicks UI menu "Danh sách đơn ca" (`/staff/orders`)

Function Description
● View full history of prepared orders within active meal session and inspect tray assembly timestamps.

Function Details
● Layout & History Table:
○ Session order history table with status badges, packing timestamps, and kitchen staff log

Screen Layout
Figure 34 - Kitchen Orders List Page

---

#### 3.4.4 Dish Stock & Shelf Stock Management Page (`/staff/stock`)

Function Trigger
● Staff clicks UI menu "Tồn kho kệ bếp" (`/staff/stock`)

Function Description
● Rapidly update actual physical dish portion counts remaining on kitchen serving shelves when kitchen replenishes fresh dishes.

Function Details
● Layout & Elements:
○ Grid of active dishes with portion steppers (`-`, `+`)
● Actions:
○ UI Button "Cập nhật tồn kho kệ"

Screen Layout
Figure 35 - Dish Stock & Shelf Stock Management Page

---

#### 3.4.5 Change Proposals Management Page (`/staff/change-proposals`)

Function Trigger
● Staff clicks UI menu "Đề xuất đổi món" (`/staff/change-proposals`)

Function Description
● Issue substitution proposals to students when an ordered dish runs out of stock during tray assembly.

Function Details
● Layout & List:
○ Active proposals list showing affected student order, out-of-stock dish, proposed alternative, and status badge
● Associated Modals:
○ `CreateChangeProposalModal`: Form modal to select out-of-stock item, suggest replacement dish, and set response deadline
● Actions:
○ UI Button "Tạo đề xuất đổi món"

Screen Layout
Figure 36 - Staff Change Proposals Page

---

#### 3.4.6 Pickup Slot & Station Monitoring Page (`/staff/pickup-slots`)

Function Trigger
● Staff clicks UI Sidebar item "Liên kết ô kệ" (`/staff/pickup-slots`)

Function Description
● Manually bind RFID trays to pickup slots during automated system hardware overrides.

Function Details
● Layout & Grid:
○ Grid of pickup slots showing live solenoid status, RFID tray ID, and manual override controls
● Associated Modals:
○ `ManualBindTrayModal`: Form to select RFID tray and pickup slot number
● Actions:
○ UI Button "Gán khay vào ô"

Screen Layout
Figure 37 - Pickup Slot & Station Monitoring Page

---

#### 3.4.7 Staff Profile Page (`/staff/profile`)

Function Trigger
● Staff clicks UI Sidebar item "Hồ sơ cá nhân" (`/staff/profile`)

Function Description
● View staff account information, assigned shift details, and trigger account logout ("Đăng xuất").

Function Details
● Form & Profile Info:
○ Staff name, email, role badge, assigned station, shift schedule
● Actions:
○ UI Button "Đăng xuất"

Screen Layout
Figure 38 - Staff Profile Page

---

### 3.5 SYSTEM ADMIN APPLICATION (Ứng dụng Quản trị viên `/admin`)

---

#### 3.5.1 Admin Dashboard (`/admin`)

Function Trigger
● System Admin authenticates and accesses `/admin`

Function Description
● System health telemetry monitoring dashboard, active user account tally, and pending student verification requests queue.

Function Details
● Layout & Metrics:
○ System uptime, API server latency, active user counts, and pending verification count cards

Screen Layout
Figure 39 - Admin Dashboard

---

#### 3.5.2 Student Identity Verifications Approval Page (`/admin/verifications`)

Function Trigger
● Admin selects UI menu "Phê duyệt xác minh sinh viên" (`/admin/verifications`)

Function Description
● Inspect uploaded student card photos, match information, and approve or reject verification requests with feedback.

Function Details
● Layout & List:
○ List of pending student verification requests displaying student name, email, student ID, submission date, and uploaded card image preview
● Associated Modals:
○ `ApproveVerificationModal`: Confirms approval via `/api/admin/verifications/[id]/approve`
○ `RejectVerificationModal`: Requires entering rejection reason feedback via `/api/admin/verifications/[id]/reject`
● Actions:
○ UI Button "Phê duyệt"
○ UI Button "Từ chối"

Screen Layout
Figure 40 - Student Identity Verifications Approval Page

---

#### 3.5.3 Audit Logs Monitoring Page (`/admin/logs`)

Function Trigger
● Admin selects UI menu "Nhật ký hệ thống" (`/admin/logs`)

Function Description
● Search and inspect system activity audit trail (System Audit Logs via `/api/admin/logs`), robot status logs, wallet topup transactions, and user permission changes.

Function Details
● Layout & Search:
○ Audit logs table with search filter by user, module, action type, or date range
● Associated Modals & Drawers:
○ `LogDetailDrawer`: Slide-over drawer displaying complete raw JSON telemetry payload for a selected log entry (`/api/admin/logs/[id]`)
● Actions:
○ Click Log Row → Opens `LogDetailDrawer`

Screen Layout
Figure 41 - Audit Logs Monitoring Page
