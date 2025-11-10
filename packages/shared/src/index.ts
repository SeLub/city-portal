export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Listing {
  id: string;
  title: string;
  type: 'goods' | 'jobs' | 'autos' | 'real_estate';
}
