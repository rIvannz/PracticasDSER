const urlBase = "localhost:3000";

document.getElementById('fetchData').addEventListener('click', ()=> {
    const etag = localStorage.getItem('etag');
    
    fetch(`http://${urlBase}/data`, {
        method: 'GET',
        headers: etag ? { 'If-None-Match': etag } : {}
    })
    .then(response => {
        if (response.status === 304) {
            console.log('Data is cached, not modified.');
            return Promise.resolve(null);
        } else {
            return response.json().then(data => {
                const newEtag = response.headers.get('ETag');
                if (newEtag) {
                    localStorage.setItem('etag', newEtag);
                    console.log(newEtag);
                }
                return data;
            });
        }
    })
    .then(data => {
        if (data) {
            const dataContainer = document.getElementById('dataContainer');
            dataContainer.innerHTML = `
                <p>${data.message}</p>
            `;
        }
    })
    .catch(error => {
        console.error('Error fetching data:', error);
    });
});