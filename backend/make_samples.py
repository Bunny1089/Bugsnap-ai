import os
from PIL import Image, ImageDraw

script_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.abspath(os.path.join(script_dir, '..'))
target_dir = os.path.join(root_dir, 'frontend', 'public', 'samples')
os.makedirs(target_dir, exist_ok=True)

# Sample 1: 404 Route Error
img1 = Image.new('RGB', (600, 320), color=(18, 24, 38))
d1 = ImageDraw.Draw(img1)
d1.rectangle([(30, 30), (570, 70)], fill=(30, 41, 59))
d1.ellipse([(45, 45), (55, 55)], fill=(239, 68, 68))
d1.ellipse([(65, 45), (75, 55)], fill=(245, 158, 11))
d1.ellipse([(85, 45), (95, 55)], fill=(16, 185, 129))
d1.text((120, 42), 'https://app.dev/settings/billing', fill=(148, 163, 184))
d1.rectangle([(60, 110), (540, 260)], fill=(30, 20, 25), outline=(239, 68, 68), width=2)
d1.text((90, 135), 'HTTP 404 NOT FOUND', fill=(239, 68, 68))
d1.text((90, 170), 'Error: Failed to load resource: /api/v1/billing/subscriptions', fill=(248, 250, 252))
d1.text((90, 205), 'The server could not find the requested route on cluster-east-2.', fill=(148, 163, 184))
img1.save(os.path.join(target_dir, 'sample1_404.png'))

# Sample 2: JavaScript Runtime Crash
img2 = Image.new('RGB', (600, 320), color=(15, 23, 42))
d2 = ImageDraw.Draw(img2)
d2.rectangle([(20, 20), (580, 60)], fill=(239, 68, 68))
d2.text((35, 30), 'Uncaught Runtime Error', fill=(255, 255, 255))
d2.text((35, 80), 'TypeError: Cannot read properties of undefined (reading items)', fill=(248, 113, 113))
d2.text((35, 120), '  at CartDrawer.render (CartDrawer.tsx:48:19)', fill=(203, 213, 225))
d2.text((35, 150), '  at ReactCompositeComponent.mountComponent (react-dom.js:142)', fill=(148, 163, 184))
d2.text((35, 180), '  at mountComponent (react-dom.js:72)', fill=(148, 163, 184))
d2.rectangle([(35, 230), (220, 275)], fill=(51, 65, 85))
d2.text((50, 245), 'Refresh Page', fill=(255, 255, 255))
img2.save(os.path.join(target_dir, 'sample2_crash.png'))

# Sample 3: Ambiguous UI overlap
img3 = Image.new('RGB', (600, 320), color=(241, 245, 249))
d3 = ImageDraw.Draw(img3)
d3.rectangle([(50, 40), (550, 100)], fill=(255, 255, 255), outline=(203, 213, 225))
d3.text((70, 60), 'Shopping Cart (2 items)', fill=(15, 23, 42))
d3.rectangle([(50, 120), (550, 280)], fill=(255, 255, 255), outline=(203, 213, 225))
d3.text((70, 140), 'Subtotal: $49.00', fill=(51, 65, 85))
# Overlapping buttons
d3.rectangle([(70, 190), (320, 250)], fill=(37, 99, 235))
d3.text((95, 212), 'Proceed to Checkout', fill=(255, 255, 255))
d3.rectangle([(250, 205), (500, 265)], fill=(239, 68, 68))
d3.text((280, 227), 'Empty Entire Cart', fill=(255, 255, 255))
img3.save(os.path.join(target_dir, 'sample3_overlap.png'))

# Sample 4: Exposed API Key
img4 = Image.new('RGB', (600, 320), color=(15, 23, 42))
d4 = ImageDraw.Draw(img4)
d4.rectangle([(40, 30), (560, 80)], fill=(30, 41, 59))
d4.text((60, 48), 'Project Settings > API & Access Tokens', fill=(248, 250, 252))
d4.rectangle([(40, 100), (560, 260)], fill=(24, 30, 48), outline=(51, 65, 85))
d4.text((60, 120), 'Production Secret Key (DO NOT SHARE):', fill=(244, 63, 94))
d4.rectangle([(60, 145), (540, 185)], fill=(15, 23, 42), outline=(244, 63, 94), width=2)
d4.text((75, 158), 'sk_mock_DEMO_EXPOSED_API_KEY_DO_NOT_USE_12345', fill=(248, 113, 113))
d4.text((60, 205), 'Warning: This token grants full administrative write access.', fill=(148, 163, 184))
img4.save(os.path.join(target_dir, 'sample4_secret.png'))

# Sample 5: CI Pipeline Failure
img5 = Image.new('RGB', (600, 320), color=(13, 17, 23))
d5 = ImageDraw.Draw(img5)
d5.rectangle([(30, 25), (570, 75)], fill=(22, 27, 34), outline=(48, 54, 61))
d5.text((50, 42), 'GitHub Actions / CI Workflow #482 (main)', fill=(240, 246, 252))
d5.rectangle([(30, 95), (570, 270)], fill=(22, 27, 34))
d5.text((50, 110), '❌ test: py311-pytest failed (exit status 1)', fill=(248, 81, 73))
d5.text((50, 145), 'FAILED tests/test_payment.py::test_stripe_webhook - ConnectionError', fill=(201, 209, 217))
d5.text((50, 175), '  HTTPSConnectionPool(host="api.stripe.com", port=443): Max retries exceeded', fill=(139, 148, 158))
d5.text((50, 205), 'Error: Process completed with exit code 1.', fill=(248, 81, 73))
img5.save(os.path.join(target_dir, 'sample5_ci.png'))

# Sample 6: Console Error
img6 = Image.new('RGB', (600, 320), color=(24, 24, 27))
d6 = ImageDraw.Draw(img6)
d6.rectangle([(20, 20), (580, 60)], fill=(39, 39, 42))
d6.text((40, 32), 'DevTools - Console', fill=(244, 244, 245))
d6.rectangle([(20, 75), (580, 270)], fill=(45, 17, 20), outline=(225, 29, 72))
d6.text((35, 95), '🔴 Uncaught SyntaxError: Unexpected token < in JSON at position 0', fill=(251, 113, 133))
d6.text((55, 130), 'at JSON.parse (<anonymous>)', fill=(228, 228, 231))
d6.text((55, 160), 'at fetchUserData (dashboard.bundle.js:1420:23)', fill=(161, 161, 170))
d6.text((55, 190), 'at async loadDashboard (dashboard.bundle.js:89:12)', fill=(161, 161, 170))
d6.text((35, 230), 'Failed to load resource: the server responded with a status of 500 ()', fill=(251, 113, 133))
img6.save(os.path.join(target_dir, 'sample6_console.png'))

# Sample 7: Form Validation Bug
img7 = Image.new('RGB', (600, 320), color=(248, 250, 252))
d7 = ImageDraw.Draw(img7)
d7.rectangle([(60, 30), (540, 80)], fill=(255, 255, 255), outline=(226, 232, 240))
d7.text((85, 48), 'Create Your Account - Signup Form', fill=(15, 23, 42))
d7.text((85, 105), 'Work Email Address', fill=(71, 85, 105))
d7.rectangle([(85, 130), (515, 175)], fill=(255, 255, 255), outline=(239, 68, 68), width=2)
d7.text((100, 145), 'developer@company.org', fill=(15, 23, 42))
d7.text((85, 185), '⚠️ "Please enter a valid work email address (RFC 5322 standard)"', fill=(220, 38, 38))
d7.rectangle([(85, 225), (280, 270)], fill=(148, 163, 184))
d7.text((120, 240), 'Submit Registration', fill=(255, 255, 255))
img7.save(os.path.join(target_dir, 'sample7_form.png'))

print("7 sample screenshots generated in frontend/public/samples/")

