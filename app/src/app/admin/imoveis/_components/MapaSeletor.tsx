"use client";

import { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";

// Ícone padrão do Leaflet (o bundler não resolve os ícones automaticamente)
const icone = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

type Props = {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
};

function ClickHandler({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

export default function MapaSeletor({ latitude, longitude, onChange }: Props) {
  const [endereco, setEndereco] = useState("");
  const [buscando, setBuscando] = useState(false);

  const centro: [number, number] = [latitude ?? -22.9248, longitude ?? -45.4614]; // default: Pindamonhangaba/SP

  async function buscarEndereco() {
    if (!endereco.trim()) return;
    setBuscando(true);
    try {
      const resposta = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(endereco)}&limit=1`
      );
      const resultados = await resposta.json();
      if (resultados[0]) {
        onChange(parseFloat(resultados[0].lat), parseFloat(resultados[0].lon));
      } else {
        alert("Endereço não encontrado. Tente digitar bairro e cidade.");
      }
    } finally {
      setBuscando(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          value={endereco}
          onChange={(e) => setEndereco(e.target.value)}
          placeholder="Digite o endereço, bairro ou cidade para localizar no mapa"
          className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={buscarEndereco}
          disabled={buscando}
          className="bg-brand-dark text-white text-sm px-4 py-2 rounded-md disabled:opacity-60"
        >
          {buscando ? "Buscando..." : "Localizar"}
        </button>
      </div>

      <div className="rounded-md overflow-hidden border" style={{ height: 320 }}>
        <MapContainer center={centro} zoom={latitude ? 16 : 13} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onChange={onChange} />
          {latitude && longitude && (
            <Marker
              position={[latitude, longitude]}
              icon={icone}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const pos = e.target.getLatLng();
                  onChange(pos.lat, pos.lng);
                }
              }}
            />
          )}
        </MapContainer>
      </div>
      <p className="text-xs text-gray-500">
        Clique no mapa ou arraste o pino para ajustar a localização exata. Você também pode digitar
        o endereço acima e clicar em "Localizar".
      </p>
    </div>
  );
}
