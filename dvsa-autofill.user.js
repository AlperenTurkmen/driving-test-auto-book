// ==UserScript==
// @name         DVSA Autofill - Configurable
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Configurable DVSA autofill script - edit CONFIG object to customize
// @match        https://driverpracticaltest.dvsa.gov.uk/application*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════════════
    // 🔧 CONFIGURATION - EDIT THESE VALUES TO CUSTOMIZE THE SCRIPT
    // ═══════════════════════════════════════════════════════════════
    const CONFIG = {
        // Personal Details
        personalDetails: {
            suffix: "Mr",
            firstName: "Mario",
            surname: "Kart",
            address1: "123 Rainbow Road",
            address2: "Mushroom Kingdom Heights",
            town: "Princess Castle",
            postcode: "MK1 2UP",
            email: "mario.kart@mushroom.kingdom",
            confirmEmail: "mario.kart@mushroom.kingdom", // Should match email
            contactNumber: "07700900123"
        },

        // Test Centre & Location
        location: {
            searchPostcode: "MK1 2UP", // Postcode to search for test centres
            preferredCentre: "Milton Keynes" // Name of test centre to select
        },

        // Driving Licence
        licence: {
            number: "KART123456M99PL", // Your driving licence number
            isExtendedTest: false, // true = extended test, false = standard
            hasSpecialNeeds: false // true = has special needs, false = none
        },

        // Date & Time Preferences
        dateTime: {
            earliestDate: "2025-07-01", // Don't book before this date (YYYY-MM-DD)
            preferredTimeAfter: 10, // Prefer slots after this hour (24-hour format)
            fallbackDate: "01/08/25" // Fallback date for date-only page (DD/MM/YY)
        },

        // Script Behavior
        timing: {
            shortDelay: 300, // Short delays between actions (ms)
            mediumDelay: 500, // Medium delays (ms)
            longDelay: 800, // Long delays (ms)
            searchTimeout: 10000 // How long to wait for elements (ms)
        }
    };

    // ═══════════════════════════════════════════════════════════════
    // 📋 END OF CONFIGURATION - SCRIPT CODE BELOW
    // ═══════════════════════════════════════════════════════════════

    const delay = (ms) => new Promise(res => setTimeout(res, ms));

    const waitFor = async (selector, timeout = CONFIG.timing.searchTimeout) => {
        const start = Date.now();
        return new Promise((resolve, reject) => {
            const check = () => {
                const el = document.querySelector(selector);
                if (el) return resolve(el);
                if (Date.now() - start > timeout) return reject(`Timeout waiting for: ${selector}`);
                requestAnimationFrame(check);
            };
            check();
        });
    };

    const waitUntilBookable = async () => {
        const maxTime = CONFIG.timing.searchTimeout;
        const interval = 300;
        const start = Date.now();

        return new Promise((resolve, reject) => {
            const check = () => {
                const bookables = [...document.querySelectorAll('td.BookingCalendar-date--bookable')];
                if (bookables.length > 0) {
                    resolve(bookables);
                } else if (Date.now() - start > maxTime) {
                    reject("❌ Timeout: No bookable dates found.");
                } else {
                    setTimeout(check, interval);
                }
            };
            check();
        });
    };

    const parseTimeToHour = (timeText) => {
        if (!timeText) {
            return null;
        }

        const timeMatch = timeText.match(/(\d{1,2}):(\d{2})(am|pm)/i);
        if (!timeMatch) {
            return null;
        }

        let hour = parseInt(timeMatch[1]);
        const minute = timeMatch[2];
        const ampm = timeMatch[3].toLowerCase();

        // Convert to 24-hour format
        if (ampm === 'pm' && hour !== 12) {
            hour += 12;
        } else if (ampm === 'am' && hour === 12) {
            hour = 0;
        }

        return hour;
    };

    const scanAndSelectBestSlot = async () => {
        await delay(CONFIG.timing.mediumDelay);

        try {
            const selector = 'input[name="slotTime"]';
            let visibleSlots = [];

            // Wait for time slots to appear
            await new Promise((resolve, reject) => {
                const start = Date.now();
                const maxWait = CONFIG.timing.searchTimeout;
                const pollInterval = 300;

                const check = () => {
                    const slots = [...document.querySelectorAll(selector)]
                    .filter(el => el.offsetParent !== null);

                    if (slots.length > 0) {
                        visibleSlots = slots;
                        resolve();
                    } else if (Date.now() - start > maxWait) {
                        reject("❌ Timeout: No time slots found.");
                    } else {
                        setTimeout(check, pollInterval);
                    }
                };
                check();
            });

            let selectedSlot = null;
            let selectedTimeText = null;
            let isAfterPreferredTime = false;

            // Single pass: scan and select immediately when found
            for (let i = 0; i < visibleSlots.length; i++) {
                const slot = visibleSlots[i];

                // Get the time text
                const label = slot.closest('label');
                const timeElement = label?.querySelector('.SlotPicker-time');
                const timeText = timeElement?.textContent.trim();

                if (timeText) {
                    const hour = parseTimeToHour(timeText);
                    if (hour !== null && hour >= CONFIG.dateTime.preferredTimeAfter) {
                        // FOUND IT! Select immediately and stop
                        selectedSlot = slot;
                        selectedTimeText = timeText;
                        isAfterPreferredTime = true;

                        // Select the slot
                        selectedSlot.scrollIntoView({ behavior: "smooth" });
                        await delay(CONFIG.timing.shortDelay);
                        selectedSlot.click();
                        selectedSlot.checked = true;
                        selectedSlot.dispatchEvent(new Event('change', { bubbles: true }));

                        break; // STOP - WE'RE DONE!
                    }
                }
            }

            // Fallback: select first available if no slot after preferred time found
            if (!selectedSlot && visibleSlots.length > 0) {
                const firstSlot = visibleSlots[0];
                const label = firstSlot.closest('label');
                const timeElement = label?.querySelector('.SlotPicker-time');
                const timeText = timeElement?.textContent.trim();

                firstSlot.scrollIntoView({ behavior: "smooth" });
                await delay(CONFIG.timing.shortDelay);
                firstSlot.click();
                firstSlot.checked = true;
                firstSlot.dispatchEvent(new Event('change', { bubbles: true }));

                selectedSlot = firstSlot;
                selectedTimeText = timeText;
                isAfterPreferredTime = false;
            }

            // Create success alert and auto-click continue
            if (selectedSlot && selectedTimeText) {
                createSelectionAlert(selectedTimeText, isAfterPreferredTime);

                // Auto-click Continue button
                await delay(CONFIG.timing.longDelay);

                const continueBtn = document.querySelector('#slot-chosen-submit') ||
                      document.querySelector('input[name="chooseSlotSubmit"]') ||
                      document.querySelector('input[value="Continue"]');

                if (continueBtn) {
                    continueBtn.scrollIntoView({ behavior: "smooth" });
                    await delay(CONFIG.timing.mediumDelay);
                    continueBtn.click();
                    // Handle 15-minute warning modal if it appears
                    await delay(1500);
                    await handleWarningDialog();
                } else {
                    console.warn("⚠️ Continue button not found. You may need to click it manually.");
                }
            }

            return { hasGoodSlots: isAfterPreferredTime, selectedTime: selectedTimeText };

        } catch (error) {
            console.error("❌ Error in slot scanning and selection:", error);
            createSelectionAlert("Error occurred", false);
            return { hasGoodSlots: false, selectedTime: null };
        }
    };

    const fillCandidateDetails = async () => {
        await waitFor('#details-suffix');

        const details = CONFIG.personalDetails;

        document.querySelector('#details-suffix').value = details.suffix;
        document.querySelector('#details-suffix').dispatchEvent(new Event('change', { bubbles: true }));
        document.querySelector('#details-first-names').value = details.firstName;
        document.querySelector('#details-surname').value = details.surname;
        document.querySelector('#details-address-1').value = details.address1;
        document.querySelector('#details-address-2').value = details.address2;
        document.querySelector('#details-town').value = details.town;
        document.querySelector('#details-postcode').value = details.postcode;
        document.querySelector('#details-email').value = details.email;
        document.querySelector('#details-confirm-email').value = details.confirmEmail;
        document.querySelector('#details-contact-number').value = details.contactNumber;

        await delay(CONFIG.timing.longDelay);

        const submitBtn = document.querySelector('#details-submit');
        if (submitBtn) {
            submitBtn.scrollIntoView({ behavior: "smooth" });
            await delay(CONFIG.timing.shortDelay);
            submitBtn.click();
        } else {
            console.warn("❌ Submit button not found on details page.");
        }

        // Handle 10-digit contact number warning modal
        setTimeout(() => {
            const confirmBtn = document.querySelector('#ten-digit-contactnumber-continue');
            if (confirmBtn && confirmBtn.offsetParent !== null) {
                confirmBtn.click();
            }
        }, 2000);
    };

    const pickAvailableDate = async () => {
        const minDate = new Date(CONFIG.dateTime.earliestDate);

        try {
            const cells = await waitUntilBookable();

            const suitableDates = cells
            .map(cell => {
                const link = cell.querySelector('a.BookingCalendar-dateLink');
                const dateStr = link?.dataset.date;
                if (!dateStr) return null;

                const date = new Date(dateStr);
                const day = link.querySelector('.BookingCalendar-day')?.textContent.trim();

                return date > minDate ? { link, dateStr, day, date } : null;
            })
            .filter(Boolean);

            if (suitableDates.length === 0) {
                console.warn(`⚠️ No suitable dates found after ${CONFIG.dateTime.earliestDate}.`);
                return false;
            }

            // Try each date until we find one with slots after preferred time
            for (let i = 0; i < suitableDates.length; i++) {
                const dateInfo = suitableDates[i];

                // Click the date
                dateInfo.link.scrollIntoView({ behavior: "smooth" });
                await delay(CONFIG.timing.shortDelay);
                dateInfo.link.dispatchEvent(new MouseEvent('click', { bubbles: true }));

                // Wait for slots to appear and scan them
                try {
                    await waitFor('input[name="slotTime"]', 6000);

                    // Use the combined scan and select function
                    const result = await scanAndSelectBestSlot();

                    if (result.hasGoodSlots) {
                        return true; // Found and selected a good slot, stop here
                    }

                } catch (slotError) {
                    // Continue to next date
                }
            }

            // If we get here, no dates had slots after preferred time
            console.warn(`⚠️ No dates found with slots after ${CONFIG.dateTime.preferredTimeAfter}:00. Selecting first available date as fallback...`);

            // Fallback: click the first suitable date
            const firstDate = suitableDates[0];
            firstDate.link.scrollIntoView({ behavior: "smooth" });
            await delay(CONFIG.timing.shortDelay);
            firstDate.link.dispatchEvent(new MouseEvent('click', { bubbles: true }));

            await waitFor('input[name="slotTime"]', 6000);
            await scanAndSelectBestSlot(); // This will select first available as fallback
            return false; // Indicate this is a fallback selection

        } catch (e) {
            console.error("🚨 Error while picking date:", e);
            return false;
        }
    };

    const createSelectionAlert = (selectedTime, isAfterPreferredTime) => {
        const existingAlert = document.getElementById('dvsa-time-alert');
        if (existingAlert) {
            existingAlert.remove();
        }

        const alert = document.createElement('div');
        alert.id = 'dvsa-time-alert';
        alert.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${isAfterPreferredTime ? '#065f46' : '#92400e'};
            color: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 300px;
            font-family: monospace;
            font-size: 12px;
            line-height: 1.4;
        `;

        const icon = isAfterPreferredTime ? '✅' : '⚠️';
        const status = isAfterPreferredTime ? 'SUCCESS' : 'FALLBACK';
        const message = isAfterPreferredTime
            ? `Selected first slot after ${CONFIG.dateTime.preferredTimeAfter}:00`
            : `No slots after ${CONFIG.dateTime.preferredTimeAfter}:00 - selected first available`;

        alert.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 10px; color: #ffffff;">
                ${icon} ${status}
            </div>
            <div style="margin-bottom: 8px;">
                <strong>Selected Time:</strong> ${selectedTime}
            </div>
            <div style="margin-bottom: 10px; font-size: 11px;">
                ${message}
            </div>
            <button onclick="this.parentElement.remove()" style="
                background: #ef4444;
                color: white;
                border: none;
                padding: 5px 10px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 11px;
            ">Close</button>
        `;

        document.body.appendChild(alert);
    };

    const handleWarningDialog = async () => {
        try {
            const warningDialog = await waitFor('#slot-hold-warning', 5000);

            const selectedTimeElement = document.querySelector('#selected-slot-time');
            const selectedTime = selectedTimeElement ? selectedTimeElement.textContent.trim() : 'Unknown time';

            const continueBtn = document.querySelector('#slot-warning-continue');
            if (continueBtn) {
                await delay(CONFIG.timing.mediumDelay);
                continueBtn.click();
            } else {
                console.warn("⚠️ Continue button not found in warning dialog");
            }

        } catch (error) {
            // Dialog didn't appear, continue normally
        }
    };

    const waitForTestCentreLink = async () => {
        const maxTime = CONFIG.timing.searchTimeout;
        const pollInterval = 300;
        const start = Date.now();

        return new Promise((resolve, reject) => {
            const check = () => {
                const links = [...document.querySelectorAll('a.test-centre-details-link')];
                const centreLink = links.find(a => a.textContent.includes(CONFIG.location.preferredCentre));

                if (centreLink) {
                    resolve(centreLink);
                } else if (Date.now() - start > maxTime) {
                    reject(`❌ Timeout: ${CONFIG.location.preferredCentre} not found in test centre results`);
                } else {
                    setTimeout(check, pollInterval);
                }
            };
            check();
        });
    };

    const clickTestCentreFinal = async () => {
        try {
            const link = await waitForTestCentreLink();
            link.scrollIntoView({ behavior: "smooth" });
            await delay(CONFIG.timing.longDelay);
            link.click();
        } catch (e) {
            console.warn(`🚨 Could not click ${CONFIG.location.preferredCentre}:`, e);
        }
    };

    const startSearchStep = async () => {
        if (localStorage.getItem("dvsaStepDone")) {
            await clickTestCentreFinal();
            return;
        }

        try {
            const input = await waitFor('#test-centres-input');
            input.focus();
            input.value = CONFIG.location.searchPostcode;
            input.dispatchEvent(new Event('input', { bubbles: true }));

            await delay(1200);
            const submitBtn = document.querySelector('#test-centres-submit');
            if (submitBtn) {
                submitBtn.click();
                localStorage.setItem("dvsaStepDone", "true");
            } else {
                console.warn("⚠️ Submit button not found.");
            }
        } catch (err) {
            console.warn("❌ Failed in search step:", err);
        }
    };

    const selectCarTest = async () => {
        const carBtn = await waitFor('input#test-type-car');
        await delay(CONFIG.timing.longDelay);
        carBtn.click();
    };

    const fillLicence = async () => {
        await waitFor("#driving-licence");

        const licence = CONFIG.licence;

        document.querySelector("#driving-licence").value = licence.number;
        document.querySelector("#extended-test-" + (licence.isExtendedTest ? "yes" : "no")).checked = true;
        document.querySelector("#special-needs-" + (licence.hasSpecialNeeds ? "yes" : "none")).checked = true;

        await delay(CONFIG.timing.longDelay);
        document.querySelector("#driving-licence-submit").click();
    };

    const fillDateOnlyPage = async () => {
        const dateInput = await waitFor('#test-choice-calendar');
        dateInput.value = CONFIG.dateTime.fallbackDate;
        dateInput.dispatchEvent(new Event('change', { bubbles: true }));
        await delay(CONFIG.timing.longDelay);
        document.querySelector('#driving-licence-submit').click();
    };

    // Add configuration display function
    const displayConfigInfo = () => {
        console.log(`
🔧 DVSA Autofill Configuration:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Location: ${CONFIG.location.preferredCentre} (${CONFIG.location.searchPostcode})
👤 Name: ${CONFIG.personalDetails.firstName} ${CONFIG.personalDetails.surname}
📧 Email: ${CONFIG.personalDetails.email}
🚗 Licence: ${CONFIG.licence.number}
📅 Earliest Date: ${CONFIG.dateTime.earliestDate}
⏰ Preferred Time: After ${CONFIG.dateTime.preferredTimeAfter}:00
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `);
    };

    window.addEventListener("load", async () => {
        const step = document.body.id;

        // Display config on first page
        if (step === "page-choose-test-type") {
            displayConfigInfo();
            localStorage.removeItem("dvsaStepDone");
        }

        try {
            if (step === "page-choose-test-type") {
                await selectCarTest();
            } else if (step === "page-driving-licence-number") {
                await fillLicence();
            } else if (step === "page-test-preferences") {
                await fillDateOnlyPage();
            } else if (step === "page-test-centre-search") {
                await startSearchStep();
            } else if (step === "page-test-centre") {
                await pickAvailableDate();
            } else if (step === "page-available-time") {
                const dateLinks = document.querySelectorAll('a.BookingCalendar-dateLink');

                if (dateLinks.length > 0) {
                    await pickAvailableDate();
                } else {
                    await scanAndSelectBestSlot();
                }
            } else if (step === "page-your-details") {
                await fillCandidateDetails();
            }
        } catch (e) {
            console.warn("❌ Unhandled script error:", e);
        }
    });
})();
