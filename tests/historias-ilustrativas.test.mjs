import test from 'node:test';
import assert from 'node:assert/strict';
import {historias,historiasDisponiveis} from '../src/features/campanhas/config/historiasIlustrativas.mjs';
import {existsSync,readFileSync} from 'node:fs';
test('oito imagens WebP e identificadores únicos',()=>{assert.equal(new Set(historias.map(h=>h.id)).size,8);for(const h of historias){const path=new URL('../public'+h.imagem,import.meta.url);assert.ok(existsSync(path),'Imagem ausente: '+h.imagem);const bytes=readFileSync(path);assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');}});
test('liberação diária às 10h de Brasília',()=>{for(let i=0;i<8;i++){const ts=Date.parse(historias[i].publicarEm);assert.equal(historiasDisponiveis(ts-1).length,i);assert.equal(historiasDisponiveis(ts).length,i+1);assert.equal(historiasDisponiveis(ts)[0].id,historias[i].id);}});
