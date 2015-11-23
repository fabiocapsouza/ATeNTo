# ATeNTo
ATeNTo (Assitant Teaching Network Tool): uma ferramenta para estímulo da participação em aula.

### Descrição

O projeto ATeNTo estabelece um servidor HTTP que utiliza WebSockets (Socket.IO) para implementar um Sistema de Resposta à Audiência (SRA). Seu objetivo é permitir a realização de perguntas de múltipla escolha em salas de aula. Os alunos respondem às perguntas utilizando dispositivos móveis (smartphones, tablets, notebooks, etc).

### Pré-requisitos

É necessário ter o framework Node.js instalado para executar essa aplicação.

### Como utilizar

A aplicação reside no arquivo index.js, que é executada na plataforma Node.js. Ele deve ser executado com privilégios de administrador, pois utiliza a porta TCP 80.


  - Em ambiente Linux:

Estando na pasta da aplicação, executar no Terminal: 
```sh
sudo node index.js
```

Estando na pasta anterior à da aplicação: 
```sh
sudo node nome_da_pasta_do_ATeNTo
```

  - Em ambiente Windows:

Estando na pasta da aplicação, executar no prompt de comando: 
```sh
node index.js
```

Estando na pasta anterior à da aplicação: 
```sh
node nome_da_pasta_do_ATeNTo
```

### Acessando o sistema ATeNTo

Após executado, o sistema pode ser acessado por dispositivos conectados à mesma rede do computador servidor, acessando o IP do servidor em um navegador de internet.

```sh
IP do Servidor: 192.168.1.10
Acesso utilizando 192.168.1.10 nos navegadores dos dispositivos conectados à mesma rede do Servidor.
```

Utilizando o computador Servidor, pode-se verificar o funcionamento e acessar o sistema utilizando também os endereços:

```sh
http://localhost
e
http://127.0.0.1
```

### Interfaces

Todas as interfaces da aplicação são páginas HTML. As interfaces principais são:

* Interface dos Alunos: arquivo clicker.html
* Interface de Controle: arquivo clicker-controle.html
* Interface Compartilhada (display de informações): arquivo clicker-display.html

Essas três interfaces se comunicam com o servidor via Socket.IO. 
As demais páginas constituem os menus do sistema.

### Módulos utilizados

O ATeNTo fez uso de diversos módulos para implementar suas funcionalidades.

* [Express] - Framework para aplicações web para Node.js
* [SocketIO] - Biblioteca para implementação de WebSocket com polyfill
* [Express-session] - Implementa Sessões para uso com Express
* [Multer] - Manipulação de formulários e upload de arquivos 'multipart/form-data'
* [Handlebars] - Fornecimento de páginas dinâmicas
* [serve-favicon] - Fornecer ícone do site (favicon.ico)
* [jQuery] - bibliteca JavaScript para manipulação DOM (uso nas páginas HTML)






   [Express]: <http://expressjs.com/>
   [SocketIO]: <http://socket.io/>
   [Express-session]: <https://github.com/expressjs/session>
   [Multer]: <https://github.com/expressjs/multer>
   [Handlebars]: <http://handlebarsjs.com/>
   [serve-favicon]: <https://github.com/expressjs/serve-favicon>
   [jQuery]: <http://jquery.com/>
