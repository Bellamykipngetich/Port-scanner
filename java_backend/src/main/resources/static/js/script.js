document.getElementById('scanForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const host = document.getElementById('host').value;
    const startPort = document.getElementById('startPort').value;
    const endPort = document.getElementById('endPort').value;

    try {
        const response = await fetch(`/api/scan?host=${host}&startPort=${startPort}&endPort=${endPort}`);
        if (!response.ok) throw new Error('Scan failed');
        const result = await response.json();

        const resultsDiv = document.getElementById('results');
        resultsDiv.innerHTML = `
            <p>Host: ${result.host}</p>
            <p>Open Ports:</p>
            <ul>${result.openPorts.map(port => `<li>Port ${port}</li>`).join('') || '<li>None</li>'}</ul>
        `;
    } catch (error) {
        document.getElementById('results').innerHTML = `<p>Error: ${error.message}</p>`;
    }
});
