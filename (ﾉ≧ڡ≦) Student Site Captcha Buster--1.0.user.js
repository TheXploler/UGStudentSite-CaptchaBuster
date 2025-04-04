// ==UserScript==
// @name         (ﾉ≧ڡ≦) Student Site Captcha Buster~
// @namespace    https://userscripts.fandrest.my.id
// @version      1.0
// @author       Fandrest
// @description  Auto Solve Basic Captcha in studentsite.gunadarma.ac.id
// @match        https://studentsite.gunadarma.ac.id/index.php/site/login
// @require      https://cdn.jsdelivr.net/npm/tesseract.js@v2.1.0/dist/tesseract.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/mathjs/11.8.0/math.min.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function createStatusElement(parentElement) {
        let statusElement = parentElement.nextElementSibling;
        if (!statusElement || !statusElement.classList.contains('equation-status')) {
            statusElement = document.createElement('div');
            statusElement.classList.add('equation-status');
            statusElement.style.cssText = `
                margin-top: 5px;
                font-size: 0.8em;
                color: #666;
                font-style: italic;
            `;
            parentElement.parentNode.insertBefore(statusElement, parentElement.nextSibling);
        }
        return statusElement;
    }

    function updateStatus(statusElement, message, type = 'info') {
        statusElement.textContent = message;
        switch(type) {
            case 'success':
                statusElement.style.color = 'green';
                break;
            case 'error':
                statusElement.style.color = 'red';
                break;
            default:
                statusElement.style.color = '#666';
        }
    }

    async function imageToText(imgSrc, statusElement) {
        try {
            updateStatus(statusElement, 'Extracting image content...');

            const { data: { text } } = await Tesseract.recognize(
                imgSrc,
                'eng',
                {
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            updateStatus(statusElement, `Processing image: ${Math.round(m.progress * 100)}%`);
                        }
                    },
                    tessedit_char_whitelist: '0123456789+-*/=()[]{}√∛∜∫∑∏πabcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
                }
            );

            const cleanedText = text.trim();
            updateStatus(statusElement, `Equation detected: ${cleanedText}`, 'success');
            return cleanedText;
        } catch (error) {
            updateStatus(statusElement, 'Failed to extract equation', 'error');
            console.error('OCR Error:', error);
            return null;
        }
    }

    function solveEquation(equation, statusElement) {
        try {
            updateStatus(statusElement, 'Solving equation...');

            const cleanedEquation = equation
            .replace(/[^\d+\-*/().=]/g, '')
            .replace(/=.*/, '');

            const result = math.evaluate(cleanedEquation);

            const roundedResult = Number(result.toFixed(4));

            updateStatus(statusElement, `Equation solved successfully!`, 'success');
            return roundedResult;
        } catch (error) {
            updateStatus(statusElement, 'Failed to solve equation', 'error');
            console.error('Equation Solving Error:', error);
            return null;
        }
    }

    async function processEquationImage() {
        const imgElement = document.querySelector('.input-group img[src^="/index.php/site/captcha"]');

        const inputElement = document.querySelector('.input-group input[name="captcha"]');

        if (imgElement && inputElement) {
            const statusElement = createStatusElement(inputElement);

            try {
                inputElement.value = '';
                updateStatus(statusElement, 'Starting equation extraction...');

                const extractedText = await imageToText(imgElement.src, statusElement);

                if (extractedText) {
                    const solvedResult = solveEquation(extractedText, statusElement);

                    if (solvedResult !== null) {
                        inputElement.value = solvedResult;
                        console.log('Solved Result:', solvedResult);
                    }
                }
            } catch (error) {
                updateStatus(statusElement, 'Unexpected error occurred', 'error');
                console.error('Processing failed:', error);
            }
        }
    }

    window.addEventListener('load', processEquationImage);
})();
