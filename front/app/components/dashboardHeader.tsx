export default function DashboardHeader() {
  return (
    <header className="header">
      <p className="eyebrow">FlowPay</p>
      <h1 className="title">Central de atendimento</h1>
      <p className="lede">
        Cada atendente atende no máximo 3 pessoas ao mesmo tempo (regra da API).
        Filas por time quando todos estão no limite. Dados em tempo real (SSE).
      </p>
    </header>
  );
}
