# Enquadramento visual das mídias

Em **Fundos → Enquadrar** e no botão de enquadramento de cada foto de serviço,
selecione Computador ou Celular, arraste a imagem e ajuste o zoom. As setas do
teclado também movem a imagem. Restaurar enquadramento centraliza apenas a tela
selecionada. Cancelar descarta os ajustes da sessão.

Em **Recortar mídia**, a imagem original aparece inteira. Arraste os quatro cantos
da seleção para escolher o trecho desejado ou arraste seu centro para movê-la.
As setas do teclado ajustam a seleção em 1%; Shift + seta ajusta em 10%.
**Ver resultado do recorte** mostra o trecho aplicado ao layout. **Remover recorte**
volta a usar a imagem inteira. O recorte também é independente para cada tela.

**Preencher área** ocupa todo o espaço e corta as bordas excedentes. **Mostrar
imagem inteira** preserva toda a foto e pode deixar espaços livres; nesse modo,
o zoom vai de 25% a 100%. Em preenchimento, vai de 25% a 300%. Abaixo de 100%,
a imagem diminui e pode deixar espaços livres. O fundo desses espaços acompanha o layout.

Nos fundos, os formatos de monitor, notebook, ultrawide e celular permitem
conferir o corte em proporções diferentes. São prévias de proporção: a janela
real pode ter outras dimensões. O mesmo ajuste se adapta ao tamanho disponível.
Nas fotos de serviço, a prévia usa a proporção 16:9 dos cartões; as miniaturas
quadradas usam o mesmo ajuste em um espaço menor.

Desktop começa em 1024 px. Abaixo disso, vale a configuração de celular.
Cada mídia tem configurações próprias; se um fundo estiver vinculado a várias
páginas, seu enquadramento será compartilhado por essas páginas.

## Arquivos e banco

O editor preserva o arquivo e sua URL. Não envia outra imagem, não recodifica
vídeos e não cria versões para cada tamanho de tela. O banco guarda somente
posição, zoom, modo de encaixe e retângulo de recorte por tipo de tela, em um pequeno objeto JSON.
As fotos de serviço continuam no campo `photoFocus`; fundos usam o novo campo
opcional `BackgroundMedia.framing`.

A migração `20261117120000_responsive_media_framing` adiciona esse campo sem
remover dados. Registros antigos continuam usando suas posições salvas, com
zoom de 100% e preenchimento da área, até serem editados.

Ampliar muito uma imagem de baixa resolução pode reduzir a nitidez. O editor
exibe um aviso acima de 200% de zoom. Usar outro arquivo continua sendo uma
opção quando a composição original não se adapta bem ao espaço do desktop.

## Verificação

Testes cobrem a geometria do arraste, a compatibilidade dos dados antigos,
validação dos limites, persistência por mídia, separação de desktop/celular,
cancelamento, restauração, zoom e renderização responsiva no catálogo e no fundo.
O recorte é validado dentro dos limites da imagem e permite remover o ajuste.
Os testes de banco e navegador usam PostgreSQL local isolado.
