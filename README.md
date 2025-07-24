
# PP All-in-One Extended – Chrome Extension

**PP All-in-One Extended** is a powerful Chrome Extension tailored for **unit testing of webpages** by both **QA engineers** and **developers**. It automates the inspection of key webpage elements such as broken links, image attributes, alt texts, analytics attributes, and CDN-served assets, ensuring robust frontend quality and SEO compliance.

---

## 🧪 Purpose

This plugin is primarily used for **Unit Testing of Webpages**. It enables developers and QA engineers to:

- Validate links and buttons for broken paths.
- Ensure that images are properly configured with alt text and appropriate dimensions.
- Check for missing or incorrect analytics attributes (e.g., `data-pa-click`).
- Confirm that media and assets (e.g., images, videos) are served from authorized CDNs.
- Ensure that videos are embedded using YouTube or other approved streaming platforms.
- Extract full details from the page and generate Excel reports.

---

## 🔍 Key Features

- ✅ **Broken Link Detection** – Detects unreachable or malformed URLs.
- 🖼️ **Image Checks** – Verifies dimensions and checks for missing `alt` attributes.
- 📊 **Analytics Tracking Validation** – Confirms presence of `data-pa-click` and other tracking attributes.
- 🌐 **CDN Media Check** – Ensures static and video content is served from the appropriate CDN.
- 🎥 **Video Source Validation** – Confirms video elements are hosted on YouTube or valid CDN.
- 🔗 **PPlinking Compliance** – Validates PayPal-specific linking conventions.
- 📄 **Supporting Text Extraction** – Captures form supporting content and messages.
- 📥 **Excel Report Generator** – Uses `alasql` and `xlsx` libraries to produce downloadable reports.

---

## 🗂 Folder Structure

```
├── background.js             # Chrome service worker logic
├── script.js                 # Main logic to extract and inspect webpage content
├── link-checker.js           # Utility script to check for broken links
├── popup.html                # UI popup displayed in browser
├── manifest.json             # Chrome Extension configuration (v3)
├── bootstrap.min.css         # Bootstrap styling
├── jqueryscripttop.css       # Custom CSS
├── jquery.min.js             # jQuery Library
├── mark.min.js               # Highlight/highlighted search utility
├── alasql.min.js             # In-browser SQL engine for table manipulation
├── xlsx.core.min.js          # Excel export utility
```

---

## 🚀 How It Works

1. The user activates the Chrome Extension by clicking on the extension icon.
2. The extension injects scripts into the current page, scanning:
   - All hyperlinks and image tags.
   - All form elements for attributes like labels, placeholders, and validations.
   - Presence of required tracking analytics.
3. A report is generated on the fly.
4. The user is prompted to **download an Excel file** summarizing the webpage test results.

---

## 🛠 Technologies & Libraries Used

- **JavaScript**
- **Chrome Extensions API**
- [**jQuery**](https://jquery.com/)
- [**alasql.js**](https://alasql.org/)
- [**SheetJS/xlsx**](https://sheetjs.com/)
- [**mark.js**](https://markjs.io/)
- [**Bootstrap**](https://getbootstrap.com/)

---

## 🧑‍💻 Installation & Setup (Developer Mode)

1. Clone or download this repository to your local machine.
2. Open Chrome and go to `chrome://extensions`.
3. Enable **Developer Mode** in the top right.
4. Click **Load unpacked** and select the extension directory.
5. The extension will now appear in your browser toolbar.
6. Open any webpage and click the extension icon to begin testing.

---

## 📥 Output

- When activated, the extension will export an `.xlsx` file that contains:
  - All image URLs, alt text, dimensions.
  - All links and their status (valid/broken).
  - Any missing analytics attributes.
  - CDN validation results.
  - PPlink compliance summary.

---

## 📦 Example Use Case

> QA tester opens a PayPal form page and activates the extension. The plugin checks if:
>
> - Every input field has a label and error message.
> - Each image has an alt text and expected dimension.
> - All links are working and include tracking attributes.
> - Media files are served from PayPal's CDN.
> - A full Excel file is generated for review and documentation.

---

## 📄 manifest.json Overview

```json
{
  "manifest_version": 3,
  "name": "PP All in one extended",
  "version": "1.3",
  "description": "Gives detailed info about the page like PPlinking, data-pa-click, broken links and images. Generates full Excel reports.",
  "author": "Suraj Yadav (surayadav.sde@gmail.com)",
  "action": {
    "default_title": "PP All in one extended"
  },
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["jquery.min.js", "alasql.min.js", "xlsx.core.min.js", "content.js", "mark.min.js"],
      "css": ["style.css"]
    }
  ],
  "permissions": ["scripting", "tabs", "activeTab"],
  "host_permissions": ["<all_urls>"]
}
```

---

## 👤 Author

**Suraj Yadav**  
📧 surayadav.sde@gmail.com  

---

## 🛡 License

This project is licensed under the **MIT License**.

---

> _Use this tool to confidently ship pixel-perfect, analytics-compliant, accessible web pages every time!_
