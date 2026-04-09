const puppeteer = require('puppeteer');

(async () => {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({ 
        headless: "new",
        args: [
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream',
        ]
    });

    const page1 = await browser.newPage();
    const page2 = await browser.newPage();

    page1.on('console', msg => console.log('PAGE 1 LOG:', msg.text()));
    page2.on('console', msg => console.log('PAGE 2 LOG:', msg.text()));

    console.log('Navigating page 1...');
    await page1.goto('http://localhost:5173/login');
    console.log('Waiting...');
    await new Promise(r => setTimeout(r, 2000));
    
    // We don't know the exact DOM elements to login and test automatically without viewing it,
    // so let's just evaluate something simpler or look at initial errors.
    
    console.log('Closing...');
    await browser.close();
})();
