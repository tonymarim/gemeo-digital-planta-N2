// Verificações portáveis usadas pelos mesmos ensaios em Node e no navegador.
export default {
 ok(value,message='Condição não satisfeita'){if(!value)throw Error(message);},
 equal(actual,expected,message){if(!Object.is(actual,expected))throw Error(message||`Esperado ${expected}; obtido ${actual}.`);},
 throws(fn){let threw=false;try{fn();}catch{threw=true;}if(!threw)throw Error('O comando inválido não foi rejeitado.');}
};
