from PIL import Image, ImageDraw, ImageFont
import io
import os

# Create a blank image with a white background
width, height = 600, 300
background_color = (255, 255, 255)
image = Image.new("RGB", (width, height), background_color)
draw = ImageDraw.Draw(image)

# Add a colorful rectangle for the background of the logo
rect_color = (41, 128, 185)  # A nice blue color
draw.rectangle([(0, 0), (width, height)], fill=rect_color)

# Add a shopping cart icon (simplified)
cart_color = (255, 255, 255)
# Cart base
draw.rectangle([(50, 200), (150, 220)], fill=cart_color)
# Cart wheels
draw.ellipse([(60, 220), (80, 240)], fill=cart_color)
draw.ellipse([(120, 220), (140, 240)], fill=cart_color)
# Cart handle
draw.arc([(50, 120), (150, 220)], 180, 270, fill=cart_color, width=5)

# Try to load a font, fallback to default if not available
try:
    # Try to use Arial Bold if available
    font = ImageFont.truetype("arial.ttf", 60)
    small_font = ImageFont.truetype("arial.ttf", 30)
except IOError:
    # Fallback to default font
    font = ImageFont.load_default()
    small_font = ImageFont.load_default()

# Add the text "FALIMY MART"
text = "FALIMY"
draw.text((200, 100), text, font=font, fill=(255, 255, 255))
text = "MART"
draw.text((200, 170), text, font=font, fill=(255, 204, 0))  # Yellow color for "MART"

# Add a tagline
tagline = "Your Convenience Store"
draw.text((200, 240), tagline, font=small_font, fill=(255, 255, 255))

# Save the image
save_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "src", "main", "resources", "static", "images", "falimy_mart_logo.png")
# Ensure directory exists
os.makedirs(os.path.dirname(save_path), exist_ok=True)
image.save(save_path)

print(f"Logo created and saved to {save_path}")