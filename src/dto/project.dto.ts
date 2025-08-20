export interface Project {
  id?: number
  name: string
  createdAt?: Date
  updatedAt?: Date
}

export interface ProjectEnvironment {
  id?: number
  projectId?: number
  name: string
  createdAt?: Date
  updatedAt?: Date
}

export interface ProjectParameter {
  id?: number
  projectId?: number
  name: string
  createdAt?: Date
  updatedAt?: Date
}