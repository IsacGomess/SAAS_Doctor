export const company = {
  name: 'Atria Tecnologia Ltda.',
  cnpj: '70.163.459/0001-91',
  email: 'atriatec.contato@gmail.com',
  website: 'https://med1pe.com.br'
};

export const supportLink = `mailto:${company.email}`;
export const withdrawalLink = `${supportLink}?subject=${encodeURIComponent('Direito de arrependimento — MED1PE')}`;
