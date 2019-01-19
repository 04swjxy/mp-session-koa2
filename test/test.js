const m = new Map();
console.log('before m', m);
function dosome() {
  m.set('id', 123456);
}
const p = Promise.resolve(dosome()).then(result => {
  console.log('after m',m);
}).catch(e => {
  console.error(e)
});

console.log(p);
