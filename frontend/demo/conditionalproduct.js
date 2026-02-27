const urlBase = "localhost:3000";

function renderProduct(data) {
  const dataContainer = document.getElementById('dataContainer');
  dataContainer.innerHTML = `
    <h3>${data.name}</h3>
    <p><b>ID:</b> ${data.id}</p>
    <p><b>Precio:</b> $${data.price}</p>
    <p><i>${data.message}</i></p>
  `;

  // Rellenar el formulario para editar
  document.getElementById('nameInput').value = data.name;
  document.getElementById('priceInput').value = data.price;
  document.getElementById('messageInput').value = data.message;
}

async function fetchProduct() {
  const etag = localStorage.getItem('productEtag');

  const res = await fetch(`http://${urlBase}/product`, {
    method: 'GET',
    headers: etag ? { 'If-None-Match': etag } : {}
  });

  const dataContainer = document.getElementById('dataContainer');

  if (res.status === 304) {
    dataContainer.innerHTML = `<p>Producto no modificado (304). Usando caché del navegador/local.</p>`;
    return;
  }

  if (!res.ok) {
    dataContainer.innerHTML = `<p>Error GET /product: ${res.status}</p>`;
    return;
  }

  const newEtag = res.headers.get('ETag');
  if (newEtag) {
    localStorage.setItem('productEtag', newEtag);
    console.log('ETag guardado:', newEtag);
  }

  const product = await res.json();
  renderProduct(product);
}

async function updateProductPut() {
  const etag = localStorage.getItem('productEtag');
  const dataContainer = document.getElementById('dataContainer');

  const body = {
    name: document.getElementById('nameInput').value.trim(),
    price: Number(document.getElementById('priceInput').value),
    message: document.getElementById('messageInput').value.trim()
  };

  const res = await fetch(`http://${urlBase}/product`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(etag ? { 'If-Match': etag } : {})
    },
    body: JSON.stringify(body)
  });

  if (res.status === 428) {
    dataContainer.innerHTML = `<p><b>428:</b> Falta If-Match. Primero haz GET para obtener el ETag.</p>`;
    return;
  }

  if (res.status === 412) {
    dataContainer.innerHTML = `
      <p><b>412:</b> ETag desfasado. Alguien/Algo actualizó el producto en el servidor.</p>
      <p>Haz clic en "Obtener producto (GET)" y luego reintenta el PUT.</p>
    `;
    return;
  }

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    dataContainer.innerHTML = `<p>Error PUT /product: ${res.status} ${err ? `- ${err.error}` : ''}</p>`;
    return;
  }

  const newEtag = res.headers.get('ETag');
  if (newEtag) {
    localStorage.setItem('productEtag', newEtag);
    console.log('ETag actualizado:', newEtag);
  }

  const payload = await res.json();
  dataContainer.innerHTML = `<p>${payload.message}</p><hr>`;
  renderProduct(payload.product);
}

document.getElementById('fetchProduct').addEventListener('click', fetchProduct);
document.getElementById('updateProduct').addEventListener('click', updateProductPut);