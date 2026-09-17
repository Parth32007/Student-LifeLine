import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Subject, SubjectUnit } from '../types';
import { api } from '../services/api';

export const DEFAULT_FOUR_SUBJECTS: Array<{
  name: string;
  color: string;
  target_grade: string;
  credits: number;
  units: Array<{
    unit_number: number;
    title: string;
    description: string;
    topics: string[];
  }>;
}> = [
  {
    name: 'DBMS',
    color: '#3B82F6',
    target_grade: 'A',
    credits: 4,
    units: [
      {
        unit_number: 1,
        title: 'Unit 1: Introduction to DBMS & Relational Model',
        description: 'Database system architectures, 3-tier schema, ER modeling, entities, relationships, relational algebra primitives.',
        topics: ['Database Architectures', 'ER Modeling & Constraints', 'Relational Model & Keys', 'Relational Algebra Operations'],
      },
      {
        unit_number: 2,
        title: 'Unit 2: SQL & Advanced Query Processing',
        description: 'DDL, DML, complex joins, nested subqueries, aggregations, window functions, and views.',
        topics: ['SQL Queries & Joins', 'Subqueries & Aggregations', 'Views & Integrity Constraints', 'Query Evaluation Plans'],
      },
      {
        unit_number: 3,
        title: 'Unit 3: Normalization & Schema Refinement',
        description: 'Functional dependencies, inference rules (Armstrong axioms), Normal forms (1NF, 2NF, 3NF, BCNF), lossless join, dependency preservation.',
        topics: ['Functional Dependencies & Closure', '1NF, 2NF & 3NF Normalization', 'Boyce-Codd Normal Form (BCNF)', 'Lossless Join Decomposition'],
      },
      {
        unit_number: 4,
        title: 'Unit 4: Transactions & Concurrency Control',
        description: 'ACID properties, serializability, conflict vs view serializability, Two-Phase Locking (2PL), deadlock prevention and detection.',
        topics: ['ACID Properties', 'Conflict Serializability', 'Two-Phase Locking (2PL)', 'Deadlock Detection & Recovery'],
      },
      {
        unit_number: 5,
        title: 'Unit 5: Storage Structures, Indexing & Recovery',
        description: 'File organization, RAID, B-Trees and B+ Trees, hashing, write-ahead logging (WAL), ARIES recovery algorithm.',
        topics: ['B+ Trees Indexing', 'Hash Indexes', 'Write-Ahead Logging (WAL)', 'System Recovery Mechanisms'],
      },
    ],
  },
  {
    name: 'Data Structures and Algorithms (DSA)',
    color: '#10B981',
    target_grade: 'A',
    credits: 4,
    units: [
      {
        unit_number: 1,
        title: 'Unit 1: Arrays, Strings & Two Pointers',
        description: 'Time/space complexity analysis, array manipulations, prefix sums, sliding window, and two-pointer techniques.',
        topics: ['Asymptotic Notations (Big-O)', 'Two Pointer Technique', 'Sliding Window Patterns', 'Prefix Sum Arrays'],
      },
      {
        unit_number: 2,
        title: 'Unit 2: Linked Lists, Stacks & Queues',
        description: 'Singly and doubly linked lists, fast and slow pointers, monotonic stacks, queue implementations, circular buffers.',
        topics: ['Singly & Doubly Linked Lists', 'Cycle Detection (Floyd Algorithm)', 'Monotonic Stack Patterns', 'Queue & Deque Implementations'],
      },
      {
        unit_number: 3,
        title: 'Unit 3: Trees, Binary Search Trees & Heaps',
        description: 'Binary tree traversals, lowest common ancestor (LCA), BST operations, AVL trees, and priority queues/binary heaps.',
        topics: ['Tree Traversals (DFS/BFS)', 'Lowest Common Ancestor (LCA)', 'Binary Search Tree Invariants', 'Min/Max Binary Heaps'],
      },
      {
        unit_number: 4,
        title: 'Unit 4: Graph Algorithms & Traversals',
        description: 'Graph representations, BFS, DFS, cycle detection, Topological sort, Dijkstra algorithm, Bellman-Ford, Disjoint Set Union (DSU).',
        topics: ['Breadth-First & Depth-First Search', 'Cycle Detection & Topological Sort', 'Dijkstra Shortest Path', 'Disjoint Set Union (Kruskal Algorithm)'],
      },
      {
        unit_number: 5,
        title: 'Unit 5: Dynamic Programming & Greedy Approaches',
        description: 'Memoization vs tabulation, 1D/2D DP, 0/1 Knapsack, Longest Common Subsequence (LCS), interval scheduling, greedy choices.',
        topics: ['1D & 2D Dynamic Programming', '0/1 Knapsack Patterns', 'Longest Common Subsequence (LCS)', 'Greedy Activity Selection'],
      },
    ],
  },
  {
    name: 'Artificial Intelligence (AI)',
    color: '#8B5CF6',
    target_grade: 'A',
    credits: 4,
    units: [
      {
        unit_number: 1,
        title: 'Unit 1: Foundations of AI & Problem Solving',
        description: 'History and state of AI, rational agents, PEAS framework, state space search representations, formulation of toy and real-world problems.',
        topics: ['Rational Agents & Environments (PEAS)', 'State Space Representations', 'Blind Search (BFS, DFS, Uniform Cost)', 'Problem Formulation Techniques'],
      },
      {
        unit_number: 2,
        title: 'Unit 2: Informed Search & Adversarial Games',
        description: 'Heuristic functions, A* search, admissibility and consistency, IDA*, game playing, Minimax algorithm, Alpha-Beta pruning.',
        topics: ['Heuristic Search & A* Algorithm', 'Admissible & Consistent Heuristics', 'Minimax Algorithm in Game Trees', 'Alpha-Beta Pruning Optimization'],
      },
      {
        unit_number: 3,
        title: 'Unit 3: Knowledge Representation & Reasoning',
        description: 'Propositional logic, First-Order Logic (FOL), inference mechanisms, forward and backward chaining, resolution, ontologies.',
        topics: ['Propositional & First-Order Logic', 'Forward & Backward Chaining', 'Resolution Refutation', 'Semantic Networks & Ontologies'],
      },
      {
        unit_number: 4,
        title: 'Unit 4: Machine Learning Fundamentals & Neural Networks',
        description: 'Supervised vs unsupervised learning, linear regression, logistic regression, decision trees, perceptrons, multilayer perceptrons, backpropagation.',
        topics: ['Supervised vs Unsupervised Paradigms', 'Linear & Logistic Regression', 'Decision Trees & Random Forests', 'Multilayer Perceptrons & Backpropagation'],
      },
      {
        unit_number: 5,
        title: 'Unit 5: NLP & Modern Generative AI',
        description: 'Text representation (TF-IDF, word embeddings), sequence models, Transformer architectures, attention mechanisms, LLM prompting principles.',
        topics: ['Word Embeddings & Vector Representations', 'Transformer & Attention Mechanism', 'Large Language Model Architecture', 'Prompt Engineering & Evaluation'],
      },
    ],
  },
  {
    name: 'Cloud Computing',
    color: '#06B6D4',
    target_grade: 'A',
    credits: 3,
    units: [
      {
        unit_number: 1,
        title: 'Unit 1: Cloud Architecture & Service Models',
        description: 'NIST cloud definitions, essential characteristics, service models (IaaS, PaaS, SaaS), deployment models (Public, Private, Hybrid, Multi-cloud).',
        topics: ['NIST Cloud Computing Definitions', 'IaaS, PaaS & SaaS Comparison', 'Deployment Models (Public, Private, Hybrid)', 'Cloud Economics & SLA Management'],
      },
      {
        unit_number: 2,
        title: 'Unit 2: Virtualization & Containerization',
        description: 'Hypervisors (Type 1 and Type 2), hardware virtualization, container fundamentals (Docker), image registries, container networking and volumes.',
        topics: ['Hypervisors & OS-level Virtualization', 'Docker Container Lifecycle', 'Container Images & Registries', 'Resource Isolation (cgroups & namespaces)'],
      },
      {
        unit_number: 3,
        title: 'Unit 3: Cloud Storage & Distributed Databases',
        description: 'Block storage, object storage (S3), file storage, CAP theorem, distributed consensus (Raft/Paxos), NoSQL database scaling.',
        topics: ['Object Storage vs Block Storage', 'CAP Theorem & PACELC', 'Distributed Consistency Models', 'NoSQL Scaling (Sharding & Replication)'],
      },
      {
        unit_number: 4,
        title: 'Unit 4: Serverless Computing & Microservices',
        description: 'Microservices design patterns, API gateways, Function-as-a-Service (FaaS), event-driven architectures, asynchronous messaging (queues/pubsub).',
        topics: ['Microservices vs Monolith Architecture', 'Serverless & FaaS Paradigms', 'API Gateways & Routing', 'Event-Driven Messaging Queues'],
      },
      {
        unit_number: 5,
        title: 'Unit 5: Cloud Security, Reliability & DevOps',
        description: 'Shared responsibility model, IAM, encryption at rest/in transit, autoscaling, load balancing, CI/CD pipelines, Infrastructure as Code (IaC).',
        topics: ['Shared Responsibility Model', 'Identity & Access Management (IAM)', 'Autoscaling & Load Balancers', 'CI/CD & Infrastructure as Code (Terraform)'],
      },
    ],
  },
];

interface SubjectContextType {
  subjects: Subject[];
  isLoading: boolean;
  loading: boolean;
  error: any;
  refetchSubjects: () => void;
  refetch: () => void;
  getSubjectUnits: (subjectId: string) => SubjectUnit[];
  addSubject: (data: {
    name: string;
    color?: string;
    target_grade?: string;
    credits?: number;
    units?: Array<{ unit_number?: number; title: string; description?: string; topics: string[] }>;
    syllabus_topics?: string[];
  }) => Promise<Subject>;
  createSubject: (data: {
    name: string;
    color?: string;
    target_grade?: string;
    credits?: number;
    units?: Array<{ unit_number?: number; title: string; description?: string; topics: string[] }>;
    syllabus_topics?: string[];
  }) => Promise<Subject>;
  updateSubject: (id: string, data: Partial<Subject>) => Promise<Subject>;
  deleteSubject: (id: string) => Promise<void>;
  updateSyllabus: (
    subjectId: string,
    units: Array<{ unit_number?: number; title: string; description?: string; topics: string[] }>
  ) => Promise<SubjectUnit[]>;
  updateSubjectSyllabus: (
    subjectId: string,
    units: Array<{ unit_number?: number; title: string; description?: string; topics: string[] }>
  ) => Promise<SubjectUnit[]>;
}

const SubjectContext = createContext<SubjectContextType | null>(null);

export const SubjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();

  const {
    data: subjects = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      let list = await api.listSubjects();
      // If student account has no subjects yet, initialize with the 4 default subjects
      if (!list || list.length === 0) {
        for (const defaultSub of DEFAULT_FOUR_SUBJECTS) {
          const flatTopics = defaultSub.units.flatMap((u) => u.topics);
          await api.createSubject({
            name: defaultSub.name,
            color: defaultSub.color,
            target_grade: defaultSub.target_grade,
            credits: defaultSub.credits,
            syllabus_topics: flatTopics,
            units: defaultSub.units.map((u) => ({
              id: `unit-${defaultSub.name.replace(/\s+/g, '-').toLowerCase()}-${u.unit_number}`,
              subject_id: '',
              unit_number: u.unit_number,
              title: u.title,
              description: u.description,
              topics: u.topics,
            })),
          });
        }
        list = await api.listSubjects();
      }
      return list;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes fresh
  });

  // Listen for local/global synchronization events
  useEffect(() => {
    const handleSync = () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    };
    window.addEventListener('lifeos:subjects-changed', handleSync);
    window.addEventListener('lifeos:data-change', handleSync);
    return () => {
      window.removeEventListener('lifeos:subjects-changed', handleSync);
      window.removeEventListener('lifeos:data-change', handleSync);
    };
  }, [queryClient]);

  // Extract units for a subject with fallback to default definitions or generated units
  const getSubjectUnits = (subjectId: string): SubjectUnit[] => {
    const sub = subjects.find((s) => s.id === subjectId);
    if (!sub) return [];

    if (sub.units && sub.units.length > 0) {
      return sub.units;
    }

    // Check if matches one of the 4 default subjects by name
    const defaultMatch = DEFAULT_FOUR_SUBJECTS.find(
      (d) => d.name.toLowerCase() === sub.name.toLowerCase() ||
             (d.name.includes('DSA') && sub.name.includes('DSA')) ||
             (d.name.includes('DBMS') && sub.name.includes('DBMS')) ||
             (d.name.includes('Artificial') && sub.name.includes('AI'))
    );
    if (defaultMatch) {
      return defaultMatch.units.map((u) => ({
        id: `unit-${sub.id}-${u.unit_number}`,
        subject_id: sub.id,
        unit_number: u.unit_number,
        title: u.title,
        description: u.description,
        topics: u.topics,
      }));
    }

    // Otherwise derive from syllabus_topics if available
    if (sub.syllabus_topics && sub.syllabus_topics.length > 0) {
      return sub.syllabus_topics.map((t, idx) => ({
        id: `unit-${sub.id}-${idx + 1}`,
        subject_id: sub.id,
        unit_number: idx + 1,
        title: t.startsWith('Unit') ? t : `Unit ${idx + 1}: ${t}`,
        topics: [t],
      }));
    }

    return [];
  };

  const addSubjectMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      color?: string;
      target_grade?: string;
      credits?: number;
      units?: Array<{ unit_number?: number; title: string; description?: string; topics: string[] }>;
      syllabus_topics?: string[];
    }) => {
      // Build units structure
      const unitsData: SubjectUnit[] = (data.units || []).map((u, idx) => ({
        id: `unit-${Date.now()}-${idx + 1}`,
        subject_id: '',
        unit_number: u.unit_number || idx + 1,
        title: u.title,
        description: u.description || '',
        topics: u.topics || [],
      }));

      const flatTopics = unitsData.length > 0
        ? unitsData.flatMap((u) => u.topics.length > 0 ? u.topics : [u.title])
        : data.syllabus_topics || [];

      const created = await api.createSubject({
        name: data.name,
        color: data.color || '#3B82F6',
        target_grade: data.target_grade || 'A',
        credits: data.credits || 4,
        syllabus_topics: flatTopics,
        units: unitsData,
      });

      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['todays-mission'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      window.dispatchEvent(new CustomEvent('lifeos:subjects-changed'));
    },
  });

  const updateSubjectMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Subject> }) => {
      return api.updateSubject(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      window.dispatchEvent(new CustomEvent('lifeos:subjects-changed'));
    },
  });

  const deleteSubjectMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.deleteSubject(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['todays-mission'] });
      window.dispatchEvent(new CustomEvent('lifeos:subjects-changed'));
    },
  });

  const updateSyllabusMutation = useMutation({
    mutationFn: async ({
      subjectId,
      units,
    }: {
      subjectId: string;
      units: Array<{ unit_number?: number; title: string; description?: string; topics: string[] }>;
    }) => {
      return api.updateSubjectSyllabus(subjectId, units);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      window.dispatchEvent(new CustomEvent('lifeos:subjects-changed'));
    },
  });

  const value = useMemo(
    () => ({
      subjects,
      isLoading,
      loading: isLoading,
      error,
      refetchSubjects: () => refetch(),
      refetch: () => refetch(),
      getSubjectUnits,
      addSubject: async (data: any) => addSubjectMutation.mutateAsync(data),
      createSubject: async (data: any) => addSubjectMutation.mutateAsync(data),
      updateSubject: async (id: string, data: any) => updateSubjectMutation.mutateAsync({ id, data }),
      deleteSubject: async (id: string) => deleteSubjectMutation.mutateAsync(id),
      updateSyllabus: async (subjectId: string, units: any) =>
        updateSyllabusMutation.mutateAsync({ subjectId, units }),
      updateSubjectSyllabus: async (subjectId: string, units: any) =>
        updateSyllabusMutation.mutateAsync({ subjectId, units }),
    }),
    [subjects, isLoading, error]
  );

  return <SubjectContext.Provider value={value}>{children}</SubjectContext.Provider>;
};

export function useSubjects(): SubjectContextType {
  const context = useContext(SubjectContext);
  if (!context) {
    throw new Error('useSubjects must be used within a SubjectProvider');
  }
  return context;
}
