# ATeNTo
ATeNTo (Assitant Teaching Network Tool): uma ferramenta para estímulo da participação em aula.

O projeto ATeNTo estabelece um servidor HTTP que utiliza WebSocket (Socket.IO) para implementar um Sistema de Resposta à Audiência (SRA), destinado a uso em salas de aula.

-Como utilizar:

A aplicação reside no arquivo index.js, que é executada na plataforma Node.js. Ele deve ser executado com privilégios de administrador, pois utiliza a porta TCP 80.

--Em Linux, com Node.js (http://www.nodejs.org) instalado:
Estando na pasta da aplicação, executar no Terminal: 
> sudo node index.js

Estando na pasta anterior à da aplicação: 
> sudo node nome_da_pasta_do_ATeNTo

--Em Windows

Após executado, o sistema pode ser acessado por dispositivos conectados à mesma rede do computador servidor, acessando o IP do servidor em um navegador de internet.

Ex:
IP do Servidor: 192.168.1.10
Acesso utilizando 192.168.1.10 nos navegadores dos dispositivos conectados à mesma rede do Servidor.

Utilizando o computador Servidor, pode-se verificar o funcionamento e acessar o sistema utilizando também os endereços:
http://localhost
e
http://127.0.0.1

Todas as interfaces da aplicação são páginas HTML. As interfaces principais são:

Interface dos Alunos: arquivo clicker.html
Interface de Controle: arquivo clicker-controle.html
Interface Compartilhada (display de informações): arquivo clicker-display.html

Essas três interfaces se comunicam com o servidor via Socket.IO. 
As demais páginas constituem os menus do sistema.

