# 🚗 DVSA Driving Test Auto-Booker

A powerful, configurable Tampermonkey userscript that automates the DVSA driving test booking process. Automatically fills forms, selects test centres, finds available dates, and books time slots based on your preferences.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-3.0-green.svg)
![Tampermonkey](https://img.shields.io/badge/tampermonkey-compatible-orange.svg)

## ✨ Features

- **🎯 Smart Time Selection**: Automatically finds and books slots after your preferred time
- **📅 Intelligent Date Picking**: Searches for available dates after your specified earliest date
- **🏢 Auto Test Centre Selection**: Finds and selects your preferred test centre
- **📝 Complete Form Automation**: Fills all personal details, licence info, and preferences
- **⚙️ Fully Configurable**: Easy-to-edit configuration object - no code diving required
- **🔄 Fallback Logic**: Smart fallbacks when preferred options aren't available
- **💡 Visual Feedback**: Real-time alerts showing what was selected and why
- **🛡️ Error Handling**: Robust error handling with helpful console messages

## 🚀 Quick Start

### 1. Install Tampermonkey
- **Chrome**: [Tampermonkey Extension](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
- **Firefox**: [Tampermonkey Add-on](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
- **Safari**: [Tampermonkey Extension](https://apps.apple.com/us/app/tampermonkey/id1482490089)

### 2. Install the Script
1. Click on the Tampermonkey extension icon
2. Select "Create a new script"
3. Copy and paste the complete script from `dvsa-autofill.user.js`
4. Save the script (Ctrl+S)

### 3. Configure Your Details
Edit the `CONFIG` object at the top of the script with your information:

```javascript
const CONFIG = {
    personalDetails: {
        suffix: "Mr",                    // Your title
        firstName: "John",               // Your first name
        surname: "Smith",                // Your surname
        address1: "123 Main Street",     // Address line 1
        address2: "Apartment 4B",        // Address line 2 (optional)
        town: "London",                  // Your town/city
        postcode: "SW1A 1AA",           // Your postcode
        email: "john.smith@email.com",   // Your email
        confirmEmail: "john.smith@email.com", // Confirm email (same as above)
        contactNumber: "07700123456"     // Your phone number
    },
    
    location: {
        searchPostcode: "SW1A 1AA",      // Postcode to search test centres
        preferredCentre: "Your Local Centre" // Test centre name
    },
    
    licence: {
        number: "SMITH123456J99XX",      // Your driving licence number
        isExtendedTest: false,           // true for extended test
        hasSpecialNeeds: false           // true if you have special needs
    },
    
    dateTime: {
        earliestDate: "2025-07-01",      // Earliest booking date (YYYY-MM-DD)
        preferredTimeAfter: 11,          // Prefer slots after this hour (24h format)
        fallbackDate: "01/07/25"         // Fallback date (DD/MM/YY)
    }
};
```

### 4. Start Booking
1. Navigate to the [DVSA booking website](https://driverpracticaltest.dvsa.gov.uk/application)
2. The script will automatically take over and guide you through the process
3. Watch the console (F12 → Console) for detailed progress updates

## 📁 Files in this Repository

- `README.md` - This documentation file
- `LICENSE` - MIT License terms
- `dvsa-autofill.user.js` - The main Tampermonkey script

## 🎛️ Configuration Options

### Personal Details
| Field | Description | Example |
|-------|-------------|---------|
| `suffix` | Title/prefix | `"Mr"`, `"Mrs"`, `"Ms"`, `"Dr"` |
| `firstName` | First name | `"John"` |
| `surname` | Last name | `"Smith"` |
| `address1` | First line of address | `"123 Main Street"` |
| `address2` | Second line of address | `"Flat 2A"` |
| `town` | Town or city | `"London"` |
| `postcode` | UK postcode | `"SW1A 1AA"` |
| `email` | Email address | `"john@email.com"` |
| `confirmEmail` | Email confirmation | `"john@email.com"` |
| `contactNumber` | Phone number | `"07700123456"` |

### Location Settings
| Field | Description | Example |
|-------|-------------|---------|
| `searchPostcode` | Postcode for test centre search | `"M1 1AA"` |
| `preferredCentre` | Name of preferred test centre | `"Manchester"` |

### Licence Information
| Field | Description | Values |
|-------|-------------|--------|
| `number` | Driving licence number | `"SMITH123456J99XX"` |
| `isExtendedTest` | Extended test requirement | `true` / `false` |
| `hasSpecialNeeds` | Special needs requirement | `true` / `false` |

### Date & Time Preferences
| Field | Description | Format | Example |
|-------|-------------|--------|---------|
| `earliestDate` | Don't book before this date | `YYYY-MM-DD` | `"2025-07-01"` |
| `preferredTimeAfter` | Prefer slots after this hour | `0-23` | `11` |
| `fallbackDate` | Backup date for certain pages | `DD/MM/YY` | `"01/07/25"` |

## 🔧 Advanced Configuration

### Timing Adjustments
If the script runs too fast/slow for your connection:

```javascript
timing: {
    shortDelay: 300,      // Quick actions (ms)
    mediumDelay: 500,     // Medium actions (ms)
    longDelay: 800,       // Slow actions (ms)
    searchTimeout: 10000  // How long to wait for elements (ms)
}
```

## 🎯 How It Works

1. **Test Type Selection**: Automatically selects car test
2. **Licence Details**: Fills in your licence number and test preferences
3. **Date Preferences**: Sets your preferred test date
4. **Test Centre Search**: Searches for test centres using your postcode
5. **Centre Selection**: Finds and selects your preferred test centre
6. **Date Selection**: Scans available dates after your earliest date
7. **Time Selection**: Finds slots after your preferred time, with smart fallbacks
8. **Personal Details**: Fills all your personal information
9. **Booking Completion**: Handles confirmations and warnings automatically

## 🚨 Important Notes

- **Legal Use Only**: This script is for personal use to automate legitimate booking attempts
- **DVSA Terms**: Ensure your usage complies with DVSA terms of service
- **Rate Limiting**: The script includes delays to be respectful to DVSA servers
- **Manual Intervention**: Some steps may require manual completion if automation fails
- **Data Privacy**: All personal data is stored locally in the script configuration

## 🐛 Troubleshooting

### Script Not Working?
1. Check the browser console (F12 → Console) for error messages
2. Verify Tampermonkey is enabled for the DVSA website
3. Ensure your configuration is valid (check for typos)
4. Try refreshing the page

### Common Issues
- **"Timeout waiting for element"**: Increase `searchTimeout` in timing configuration
- **Wrong test centre selected**: Check your `preferredCentre` name matches exactly
- **No suitable dates found**: Adjust your `earliestDate` to allow more options

### Debug Mode
Enable detailed logging by opening browser console (F12) before starting the booking process.

## 📝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This script is provided "as is" without warranty. Users are responsible for ensuring their usage complies with DVSA terms of service and applicable laws. The authors are not responsible for any consequences of using this script.

## 🌟 Star History

If this script helped you book your driving test, please consider giving it a star! ⭐

---

**Made with ❤️ for UK driving test candidates**
