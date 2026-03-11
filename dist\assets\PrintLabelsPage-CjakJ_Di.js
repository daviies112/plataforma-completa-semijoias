import{r as l,j as e}from"./main-BG6DkbL4.js";import{J as M,L as u}from"./App-CHRoqvP5.js";import"./LogoHeader-D6i1Qecx.js";import"./card-DGHkV-kR.js";import"./index-BP3H3xya.js";import"./checkbox-vYOm2Qal.js";import"./check-BpBjSxPn.js";import"./supabase-CKJyCp7z.js";import"./download-mZc4uvXk.js";import"./video-tr-3tyB-.js";import"./file-text-DkptLx5o.js";import"./shield-check-goTjBWZq.js";import"./upload-Bzn0aAt6.js";import"./trending-up-DObcbnKA.js";import"./trophy-D7vN5h3Q.js";import"./copy-BQCvQ2Qv.js";import"./input-BEtcY31C.js";import"./map-pin-CsD7GYnb.js";import"./colorScheme-Dg89g7gw.js";import"./camera-DSpUAmDl.js";const P=()=>{const[t,a]=l.useState(null),[d,i]=l.useState(null);if(l.useEffect(()=>{const s=localStorage.getItem("print_queue");s&&a(JSON.parse(s));const r=localStorage.getItem("printer_logo_config");r&&i(JSON.parse(r))},[]),!t)return e.jsx("div",{className:"p-10 text-center font-sans",children:"Carregando fila de impressão..."});const n=[];for(let s=1;s<t.startPosition;s++)n.push({isSkip:!0});return t.products.forEach(s=>{for(let r=0;r<(s.copies||1);r++)n.push({...s,isSkip:!1})}),e.jsxs("div",{className:"bg-white min-h-screen text-black font-sans print:p-0",children:[e.jsxs("div",{className:"no-print p-4 bg-gray-100 border-b flex justify-between items-center shadow-sm",children:[e.jsxs("div",{children:[e.jsx("h1",{className:"font-bold text-lg",children:"Visualização de Impressão Jueri"}),e.jsxs("p",{className:"text-xs text-gray-600",children:["Modelo: ",t.model," | ",n.length," etiquetas na fila"]})]}),e.jsxs("div",{className:"flex gap-2",children:[e.jsx("button",{onClick:()=>window.location.reload(),className:"px-4 py-2 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors",children:"Recarregar"}),e.jsx("button",{onClick:()=>window.print(),className:"px-4 py-2 bg-green-600 text-white rounded text-sm font-bold shadow-md hover:bg-green-700 transition-colors",children:"Imprimir Agora"})]})]}),e.jsx("div",{className:`print-container model-${t.model.replace(/[^a-zA-Z0-9]/g,"_")}`,children:n.map((s,r)=>e.jsx("div",{className:`label-item ${s.isSkip?"skip":""}`,children:!s.isSkip&&e.jsx(f,{item:s,model:t.model,showLogo:t.showLogo,logoConfig:d})},r))}),e.jsx("style",{dangerouslySetInnerHTML:{__html:`
        @media screen {
          .print-container {
            padding: 40px;
            display: grid;
            gap: 2px;
            background: #e5e7eb;
            width: fit-content;
            margin: 20px auto;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
          }
          .label-item {
            background: white;
            border: 1px dashed #d1d5db;
            position: relative;
          }
          .label-item.skip {
            background: #f3f4f6;
            opacity: 0.5;
            background-image: repeating-linear-gradient(45deg, #ddd 0, #ddd 1px, transparent 0, transparent 50%);
            background-size: 10px 10px;
          }
        }

        @media print {
          .no-print { display: none !important; }
          body { margin: 0; padding: 0; background: white; }
          .print-container { 
            display: grid !important; 
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
          .label-item { border: none !important; }
          @page { margin: 0; }
        }

        /* CONFIGURAÇÕES DE GRADE POR MOLDES ESPECÍFICOS */
        
        /* 92MMX10MM / 90MMX12MM (Etiqueta de Anel/Fina) */
        .model-92MMX10MM, .model-90MMX12MM, .model-SLP_JEWEL {
          grid-template-columns: 1fr;
          width: 90mm;
        }
        .model-92MMX10MM .label-item { width: 92mm; height: 10mm; }
        .model-90MMX12MM .label-item { width: 90mm; height: 12mm; }

        /* 25MMx13MMx2 / 25MMx10MMx2 (2 por linha) */
        .model-25MMx13MMx2, .model-25MMx10MMx2, .model-29MMx11MMx2 {
          grid-template-columns: repeat(2, 1fr);
          width: calc(25mm * 2 + 3mm); /* Aproximado com gap */
          gap: 2mm;
        }
        .model-25MMx13MMx2 .label-item { width: 25mm; height: 13mm; }
        .model-25MMx10MMx2 .label-item { width: 25mm; height: 10mm; }

        /* Retangulares Avulsas */
        .model-26MMx14MM .label-item { width: 26mm; height: 14mm; }
        .model-30MMx20MM .label-item { width: 30mm; height: 20mm; }
        .model-33MMx21MM .label-item { width: 33mm; height: 21mm; }
        .model-37MMx14MM .label-item { width: 37mm; height: 14mm; }

        /* Pimaco 126 (Exemplo de Grade 4x) */
        .model-126_pimaco {
          grid-template-columns: repeat(4, 1fr);
          width: 210mm; /* A4 */
        }
      `}})]})},f=({item:t,model:a,showLogo:d,logoConfig:i})=>{const n=l.useRef(null),s=i?.titleFontSize?`${i.titleFontSize}pt`:"9pt",r=i?.priceFontSize?`${i.priceFontSize}pt`:"12pt",o=i?.codeFontSize?`${i.codeFontSize}pt`:"8pt",m=(c=>{const p=u.find(x=>x.value===c);return p?{widthMm:p.widthMm,heightMm:p.heightMm}:a.includes("90MM")?{widthMm:90,heightMm:12}:a.includes("92MM")?{widthMm:92,heightMm:10}:{widthMm:60,heightMm:40}})(a);l.useEffect(()=>{if(n.current&&t.barcode){const c=a.toLowerCase().includes("retangular")||a.includes("x");M(n.current,t.barcode,{format:"CODE128",width:1.2,height:c?15:25,displayValue:!1,margin:0})}},[t.barcode,a]);const h=()=>!d||!i||!i.showLogo||!i.logoBase64?null:e.jsx("img",{src:i.logoBase64,alt:"Logo",style:{position:"absolute",left:`${i.logoX/(m.widthMm||1)*100}%`,top:`${i.logoY/(m.heightMm||1)*100}%`,width:`${i.logoWidth/(m.widthMm||1)*100}%`,height:`${i.logoHeight/(m.heightMm||1)*100}%`,opacity:i.logoOpacity,objectFit:"contain",zIndex:20,pointerEvents:"none"}});return a.includes("92MM")||a.includes("90MM")||a.includes("JEWEL")?e.jsxs("div",{className:"flex h-full w-full items-center px-[2mm] text-black overflow-hidden bg-white relative",children:[e.jsx(h,{}),e.jsxs("div",{className:"flex-[4] flex flex-col justify-center items-center overflow-hidden",children:[e.jsx("svg",{ref:n,className:"max-w-full max-h-[8mm]"}),e.jsx("span",{className:"font-mono leading-none mt-0.5",style:{fontSize:o},children:t.barcode})]}),e.jsx("div",{className:"w-[12mm] border-x border-gray-100 h-[60%] border-dashed"}),e.jsxs("div",{className:"flex-[6] flex flex-col justify-center leading-tight pl-2",children:[e.jsx("p",{className:"font-bold truncate uppercase",style:{fontSize:s},children:t.description}),e.jsxs("div",{className:"flex justify-between items-baseline mt-0.5",children:[e.jsx("span",{className:"font-mono opacity-80",style:{fontSize:o},children:t.reference}),e.jsx("span",{className:"font-black",style:{fontSize:r},children:t.price})]})]})]}):e.jsxs("div",{className:"h-full w-full flex flex-col items-center justify-between py-[1mm] px-[1mm] text-black bg-white overflow-hidden relative",children:[e.jsx(h,{}),e.jsx("p",{className:"font-bold text-center leading-[1.1] truncate w-full",style:{fontSize:s},children:t.description}),e.jsxs("div",{className:"flex flex-col items-center w-full",children:[e.jsx("svg",{ref:n,className:"max-w-[95%] max-h-[10mm]"}),e.jsx("span",{className:"font-mono mt-0.5",style:{fontSize:o},children:t.barcode})]}),e.jsxs("div",{className:"flex justify-between w-full items-center border-t border-gray-100 pt-0.5",children:[e.jsx("span",{className:"font-medium opacity-70",style:{fontSize:o},children:t.reference}),e.jsx("span",{className:"font-black",style:{fontSize:r},children:t.price})]})]})};export{P as default};
