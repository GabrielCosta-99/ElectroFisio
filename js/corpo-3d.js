
// Modelo 3D simples do corpo na tela de eletrodos.
// Cada parte é clicável e as vistas Anterior / Posterior / Lateral giram a câmera.
// Conversa com js/eletrodos.js pelos eventos "corpo-atualizado" e "corpo-clicado".

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const area3d = document.getElementById("corpo3d");
const figuraPlana = document.getElementById("figuraCorpo");

let renderizador = null;
try {
    renderizador = new THREE.WebGLRenderer({ antialias: true, alpha: true });
} catch (erro) {
    // Sem WebGL: continua com a figura plana
}

if (renderizador) {
    iniciar();
}

function iniciar() {

    // A figura plana fica escondida; continua no HTML como reserva
    figuraPlana.classList.add("escondido");
    area3d.classList.remove("escondido");

    renderizador.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderizador.outputColorSpace = THREE.SRGBColorSpace;
    area3d.appendChild(renderizador.domElement);

    const cena = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);

    const ALVO = new THREE.Vector3(0, 8, 0);
    const DISTANCIA = 36;

    // Posição da câmera em cada vista do corpo
    const VISTAS = {
        anterior: new THREE.Vector3(0, 9, DISTANCIA),
        posterior: new THREE.Vector3(0, 9, -DISTANCIA),
        lateral: new THREE.Vector3(DISTANCIA, 9, 0)
    };

    camera.position.copy(VISTAS.anterior);

    const controles = new OrbitControls(camera, renderizador.domElement);
    controles.target.copy(ALVO);
    controles.enableDamping = true;
    controles.enablePan = false;
    controles.minDistance = 18;
    controles.maxDistance = 50;
    controles.update();

    // Luzes
    cena.add(new THREE.HemisphereLight(0xffffff, 0xb8c4c0, 1.8));
    const luz = new THREE.DirectionalLight(0xffffff, 1.4);
    luz.position.set(6, 14, 12);
    cena.add(luz);
    const luzTras = new THREE.DirectionalLight(0xffffff, 0.6);
    luzTras.position.set(-6, 10, -12);
    cena.add(luzTras);

    // ---------------------------------------------------------------
    // Boneco feito de formas simples
    // ---------------------------------------------------------------

    const COR_BASE = new THREE.Color(0xd8dfdc);
    const COR_SOBRE = new THREE.Color(0xb9e3dc);
    const COR_ESCOLHIDA = new THREE.Color(0x48bfaf);

    const corpo = new THREE.Group();
    cena.add(corpo);

    const partes = [];

    function material() {
        return new THREE.MeshStandardMaterial({ color: COR_BASE.clone(), roughness: 0.7 });
    }

    function adicionar(area, geometria, x, y, z, ajustar) {
        const malha = new THREE.Mesh(geometria, material());
        malha.position.set(x, y, z);
        malha.userData.area = area;
        if (ajustar) ajustar(malha);
        corpo.add(malha);
        partes.push(malha);
        return malha;
    }

    // Cabeça (com nariz para mostrar onde é a frente) e pescoço
    const cabeca = adicionar("cabeca", new THREE.SphereGeometry(1.0, 32, 24), 0, 15.0, 0, m => m.scale.set(1, 1.15, 1));
    const nariz = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 12), cabeca.material);
    nariz.position.set(0, -0.05, 0.98);
    nariz.userData.area = "cabeca";
    cabeca.add(nariz);
    partes.push(nariz);

    adicionar("pescoco", new THREE.CylinderGeometry(0.45, 0.5, 0.9, 20), 0, 13.6, 0);

    // Tronco
    adicionar("tronco", new RoundedBoxGeometry(3.3, 2.5, 1.8, 4, 0.5), 0, 11.95, 0);
    adicionar("abdome", new RoundedBoxGeometry(2.8, 1.9, 1.6, 4, 0.45), 0, 9.85, 0);
    adicionar("pelve", new RoundedBoxGeometry(3.0, 1.4, 1.7, 4, 0.5), 0, 8.3, 0);

    // Braços, antebraços e mãos dos dois lados
    [-1, 1].forEach(lado => {
        adicionar("braco", new THREE.CapsuleGeometry(0.42, 2.0, 8, 16), lado * 2.25, 11.5, 0, m => { m.rotation.z = lado * 0.12; });
        adicionar("antebraco", new THREE.CapsuleGeometry(0.36, 1.9, 8, 16), lado * 2.55, 8.9, 0.1, m => { m.rotation.z = lado * 0.06; });
        adicionar("mao", new THREE.SphereGeometry(0.5, 20, 16), lado * 2.7, 7.25, 0.15, m => m.scale.set(0.8, 1.2, 0.55));

        // Pernas
        adicionar("coxa", new THREE.CapsuleGeometry(0.62, 2.6, 8, 16), lado * 0.85, 6.0, 0);
        adicionar("joelho", new THREE.SphereGeometry(0.7, 20, 16), lado * 0.85, 4.2, 0.05, m => m.scale.set(1, 0.85, 1));
        adicionar("perna", new THREE.CapsuleGeometry(0.46, 2.6, 8, 16), lado * 0.85, 2.3, 0);
        adicionar("pe", new RoundedBoxGeometry(0.85, 0.5, 1.7, 3, 0.2), lado * 0.85, 0.25, 0.35);
    });

    // ---------------------------------------------------------------
    // Cores: região escolhida e região com o mouse em cima
    // ---------------------------------------------------------------

    let areaEscolhida = document.body.dataset.area || "tronco";
    let areaSobMouse = null;

    function pintar() {
        partes.forEach(parte => {
            const area = parte.userData.area;
            if (area === areaEscolhida) {
                parte.material.color.copy(COR_ESCOLHIDA);
            } else if (area === areaSobMouse) {
                parte.material.color.copy(COR_SOBRE);
            } else {
                parte.material.color.copy(COR_BASE);
            }
        });
    }

    // ---------------------------------------------------------------
    // Clique e mouse em cima
    // ---------------------------------------------------------------

    const raio = new THREE.Raycaster();
    const ponto = new THREE.Vector2();
    let inicioClique = null;

    function areaNaPosicao(evento) {
        const limites = renderizador.domElement.getBoundingClientRect();
        ponto.set(
            ((evento.clientX - limites.left) / limites.width) * 2 - 1,
            -((evento.clientY - limites.top) / limites.height) * 2 + 1
        );
        raio.setFromCamera(ponto, camera);
        const acerto = raio.intersectObjects(partes, false)[0];
        return acerto ? acerto.object.userData.area : null;
    }

    const tela = renderizador.domElement;

    tela.addEventListener("pointerdown", evento => {
        inicioClique = [evento.clientX, evento.clientY];
    });

    tela.addEventListener("pointerup", evento => {
        if (!inicioClique) return;

        // Se arrastou, foi para girar e não para escolher
        const distancia = Math.hypot(evento.clientX - inicioClique[0], evento.clientY - inicioClique[1]);
        inicioClique = null;
        if (distancia > 5) return;

        const area = areaNaPosicao(evento);
        if (area) {
            document.dispatchEvent(new CustomEvent("corpo-clicado", { detail: area }));
        }
    });

    tela.addEventListener("pointermove", evento => {
        if (evento.buttons) return;
        const area = areaNaPosicao(evento);
        if (area !== areaSobMouse) {
            areaSobMouse = area;
            pintar();
        }
        tela.style.cursor = area ? "pointer" : "grab";
    });

    tela.addEventListener("pointerleave", () => {
        areaSobMouse = null;
        pintar();
    });

    // ---------------------------------------------------------------
    // Troca de vista com giro suave da câmera
    // ---------------------------------------------------------------

    const reduzirMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let vistaAtual = document.body.dataset.vista || "anterior";
    let animacao = null;

    function irParaVista(vista) {
        const destino = VISTAS[vista];
        if (!destino) return;

        if (reduzirMovimento) {
            camera.position.copy(destino);
            controles.target.copy(ALVO);
            return;
        }

        // Gira em volta do corpo (e não em linha reta, que passaria por dentro dele)
        const inicio = new THREE.Spherical().setFromVector3(camera.position.clone().sub(ALVO));
        const fim = new THREE.Spherical().setFromVector3(destino.clone().sub(ALVO));

        let diferenca = fim.theta - inicio.theta;
        if (diferenca > Math.PI) diferenca -= Math.PI * 2;
        if (diferenca < -Math.PI) diferenca += Math.PI * 2;

        animacao = {
            inicio: inicio,
            fim: fim,
            diferenca: diferenca,
            comeco: performance.now(),
            duracao: 700
        };
    }

    function animarCamera(agora) {
        if (!animacao) return;

        let t = Math.min(1, (agora - animacao.comeco) / animacao.duracao);
        t = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // suaviza início e fim

        const esfera = new THREE.Spherical(
            animacao.inicio.radius + (animacao.fim.radius - animacao.inicio.radius) * t,
            animacao.inicio.phi + (animacao.fim.phi - animacao.inicio.phi) * t,
            animacao.inicio.theta + animacao.diferenca * t
        );

        camera.position.setFromSpherical(esfera).add(ALVO);
        controles.target.copy(ALVO);

        if (t >= 1) animacao = null;
    }

    // Avisos da tela de eletrodos
    document.addEventListener("corpo-atualizado", evento => {
        areaEscolhida = evento.detail.area;
        pintar();

        if (evento.detail.vista !== vistaAtual) {
            vistaAtual = evento.detail.vista;
            irParaVista(vistaAtual);
        }
    });

    // ---------------------------------------------------------------
    // Tamanho e animação
    // ---------------------------------------------------------------

    function redimensionar() {
        const largura = area3d.clientWidth;
        const altura = area3d.clientHeight;
        renderizador.setSize(largura, altura);
        camera.aspect = largura / altura;
        camera.updateProjectionMatrix();
    }

    new ResizeObserver(redimensionar).observe(area3d);
    redimensionar();

    camera.position.copy(VISTAS[vistaAtual] || VISTAS.anterior);
    pintar();

    function animar(agora) {
        requestAnimationFrame(animar);
        animarCamera(agora);
        controles.update();
        renderizador.render(cena, camera);
    }

    requestAnimationFrame(animar);
}
