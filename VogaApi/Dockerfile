# 1. Etapa de Construção (Usa o SDK completo para compilar o código)
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copia o arquivo de projeto e restaura as dependências
COPY ["VogaApi.csproj", "./"]
RUN dotnet restore "VogaApi.csproj"

# Copia o resto do código e compila a versão final (Release)
COPY . .
RUN dotnet publish "VogaApi.csproj" -c Release -o /app/publish

# 2. Etapa de Execução (Usa uma versão super leve do C# apenas para rodar a API)
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/publish .

# Avisa o Render que a API vai rodar na porta 8080
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

# Liga o motor!
ENTRYPOINT ["dotnet", "VogaApi.dll"]