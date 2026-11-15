$filesToUpload = @(
    @{
        Key = "alunos/NIT0312013/trab_ws_joaom/index.html"
        File = "../trabalhos/trabalhos-data/websocket/joao-matheus/index.html"
        Type = "text/html; charset=utf-8"
    },
    @{
        Key = "alunos/NIT0312013/trab_ws_joaom/style.css"
        File = "../trabalhos/trabalhos-data/websocket/joao-matheus/style.css"
        Type = "text/css; charset=utf-8"
    },
    @{
        Key = "alunos/NIT0312006/trab_ftp_pedro/index.html"
        File = "../trabalhos/trabalhos-data/ftp-sftp/pedro/index.html"
        Type = "text/html; charset=utf-8"
    },
    @{
        Key = "alunos/NIT0312006/trab_ftp_pedro/style.css"
        File = "../trabalhos/trabalhos-data/ftp-sftp/pedro/style.css"
        Type = "text/css; charset=utf-8"
    },
    @{
        Key = "alunos/NIT0312006/trab_ftp_pedro/script.js"
        File = "../trabalhos/trabalhos-data/ftp-sftp/pedro/script.js"
        Type = "application/javascript; charset=utf-8"
    },
    @{
        Key = "alunos/NIT0312003/trab_graphql_raphael/index.html"
        File = "../trabalhos/trabalhos-data/graphql-api-cliente/raphael/index.html"
        Type = "text/html; charset=utf-8"
    },
    @{
        Key = "alunos/NIT0312003/trab_graphql_raphael/style.css"
        File = "../trabalhos/trabalhos-data/graphql-api-cliente/raphael/style.css"
        Type = "text/css; charset=utf-8"
    },
    @{
        Key = "alunos/NIT0312003/trab_graphql_raphael/script.js"
        File = "../trabalhos/trabalhos-data/graphql-api-cliente/raphael/script.js"
        Type = "application/javascript; charset=utf-8"
    },
    @{
        Key = "alunos/NIT0312010/trab_polling_joaop/Trabalho_HTTP.html"
        File = "../trabalhos/trabalhos-data/http-long-polling/joao-pedro/Trabalho_HTTP.html"
        Type = "text/html; charset=utf-8"
    },
    @{
        Key = "alunos/NIT0312008/trab_ssh_joaov/index.html"
        File = "../trabalhos/trabalhos-data/ssh/joao-vinicius/index.html"
        Type = "text/html; charset=utf-8"
    },
    @{
        Key = "alunos/NIT0312008/trab_ssh_joaov/css/style.css"
        File = "../trabalhos/trabalhos-data/ssh/joao-vinicius/css/style.css"
        Type = "text/css; charset=utf-8"
    },
    @{
        Key = "alunos/NIT0312008/trab_ssh_joaov/js/script.js"
        File = "../trabalhos/trabalhos-data/ssh/joao-vinicius/js/script.js"
        Type = "application/javascript; charset=utf-8"
    },
    @{
        Key = "alunos/NIT0312015/trab_stomp_lucas/index.html"
        File = "../trabalhos/trabalhos-data/stomp/lucas-bayao/index.html"
        Type = "text/html; charset=utf-8"
    },
    @{
        Key = "alunos/NIT0312015/trab_stomp_lucas/style.css"
        File = "../trabalhos/trabalhos-data/stomp/lucas-bayao/style.css"
        Type = "text/css; charset=utf-8"
    },
    @{
        Key = "alunos/NIT0312015/trab_stomp_lucas/script.js"
        File = "../trabalhos/trabalhos-data/stomp/lucas-bayao/script.js"
        Type = "application/javascript; charset=utf-8"
    },
    @{
        Key = "alunos/NIT0312004/trab_udp_marcos/apresentacao_do_marcos.html"
        File = "../trabalhos/trabalhos-data/udp-datagramas/marcos/apresentacao_do_marcos.html"
        Type = "text/html; charset=utf-8"
    }
)

foreach ($item in $filesToUpload) {
    Write-Host "Enviando $($item.Key)..."
    npx wrangler r2 object put "devsenai-trabalhos/$($item.Key)" --file="$($item.File)" --content-type="$($item.Type)" --remote
}

Write-Host "Upload concluido!"
