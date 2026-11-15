-- Carga Inicial (Seed) dos Trabalhos Já Entregues da Turma
INSERT OR REPLACE INTO trabalhos (id, aluno_id, titulo, modulo, descricao, entry_url) VALUES
(
    'trab_mqtt_matheus',
    'aluno_matheus',
    'Apresentação Protocolo MQTT',
    'MQTT Pub/Sub',
    'Apresentação interativa sobre a arquitetura e funcionamento do protocolo MQTT (Publish/Subscribe).',
    'https://pub-ff69a66708ca48ab894fd03e1fefefa4.r2.dev/alunos/NIT0312011/trab_mqtt_matheus/slides_Matheus.html'
),
(
    'trab_ws_joaom',
    'aluno_joao_m',
    'Apresentação sobre WebSockets',
    'WebSocket',
    'Apresentação prática sobre comunicação full-duplex e bidirecional em tempo real com WebSockets.',
    'https://pub-ff69a66708ca48ab894fd03e1fefefa4.r2.dev/alunos/NIT0312013/trab_ws_joaom/index.html'
),
(
    'trab_ftp_pedro',
    'aluno_pedro',
    'Protocolos FTP e SFTP',
    'FTP/SFTP',
    'Estudo e apresentação detalhada dos protocolos de transferência de arquivos FTP e SFTP.',
    'https://pub-ff69a66708ca48ab894fd03e1fefefa4.r2.dev/alunos/NIT0312006/trab_ftp_pedro/index.html'
),
(
    'trab_graphql_raphael',
    'aluno_raphael',
    'API Cliente com GraphQL',
    'API cliente com GraphQL',
    'Desenvolvimento de consumo e queries de APIs cliente utilizando GraphQL.',
    'https://pub-ff69a66708ca48ab894fd03e1fefefa4.r2.dev/alunos/NIT0312003/trab_graphql_raphael/index.html'
),
(
    'trab_polling_joaop',
    'aluno_joao_p',
    'HTTP Long Polling na Prática',
    'HTTP Long Polling',
    'Mecanismo de emulação de comunicação em tempo real via HTTP Long Polling.',
    'https://pub-ff69a66708ca48ab894fd03e1fefefa4.r2.dev/alunos/NIT0312010/trab_polling_joaop/Trabalho_HTTP.html'
),
(
    'trab_ssh_joaov',
    'aluno_joao_v',
    'Protocolo SSH e Acesso Remoto Seguro',
    'SSH',
    'Princípios criptográficos e operação do protocolo SSH para túneis e sessões seguras.',
    'https://pub-ff69a66708ca48ab894fd03e1fefefa4.r2.dev/alunos/NIT0312008/trab_ssh_joaov/index.html'
),
(
    'trab_stomp_lucas',
    'aluno_lucas',
    'Protocolo STOMP em Mensageria',
    'STOMP',
    'Simple Text Oriented Messaging Protocol (STOMP) e integrações assíncronas.',
    'https://pub-ff69a66708ca48ab894fd03e1fefefa4.r2.dev/alunos/NIT0312015/trab_stomp_lucas/index.html'
),
(
    'trab_udp_marcos',
    'aluno_marcos',
    'Datagramas UDP e Redes Rápidas',
    'Datagramas UDP',
    'Características, velocidade e casos de uso de datagramas UDP sem handshake.',
    'https://pub-ff69a66708ca48ab894fd03e1fefefa4.r2.dev/alunos/NIT0312004/trab_udp_marcos/apresentacao_do_marcos.html'
);
