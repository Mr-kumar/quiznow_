export interface Subject {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    topics: number;
  };
}

export interface Topic {
  id: string;
  name: string;
  subjectId?: string;
  parentId?: string;
  subject?: Subject;
  parent?: {
    id: string;
    name: string;
  };
  createdAt?: string;
  updatedAt?: string;
}
