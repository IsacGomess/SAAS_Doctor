import { company, supportLink } from '../company';

export default function CompanyIdentification() {
  return (
    <address className="mb-0">
      <strong>{company.name}</strong>
      <div>CNPJ {company.cnpj}</div>
      <div><a href={company.website}>{company.website}</a></div>
      <a href={supportLink}>{company.email}</a>
    </address>
  );
}
