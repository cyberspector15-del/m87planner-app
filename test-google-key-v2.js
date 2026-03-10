
const API_KEY = "AIzaSyDLHCIBhrHVZjeL5Q7FRfNPkOqr_H-z70s";

async function listModels() {
    console.log(`Listing available models...`);
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            console.log(`FAILED (${response.status}):`, data.error?.message || data);
        } else {
            console.log(`SUCCESS (${response.status})`);
            if (data.models) {
                data.models.forEach(m => console.log(`- ${m.name}`));
            } else {
                console.log("No models found in response.");
            }
        }
    } catch (error) {
        console.error("NETWORK ERROR:", error);
    }
}

listModels();
