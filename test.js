const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
async function test() {
  try {
    const res = await fetch('https://uaiveiculos.vercel.app/api/create-pix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Marcio Silva', cpf: '14924671622', phone: '31999999999' })
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.log(e);
  }
}
test();
