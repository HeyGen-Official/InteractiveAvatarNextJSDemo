// Define the type for each case study object
export interface CaseStudy {
    id: number;
    title: string;
    author: string;
    institution: string;
    publication_year: number;
    industry: string;
    company: string;
    summary: string;
    key_decisions: string[];
    challenges: string[];
    outcomes: string[];
    decision_making_style: string;
    url: string;
  }