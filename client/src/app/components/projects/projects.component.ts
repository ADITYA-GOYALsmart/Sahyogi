import { Component, OnInit } from '@angular/core';
import {
  Project,
  ProjectManagerService,
} from '../../services/project-manager.service/project-manager.service';
import { GetCurrentUserService } from '../../services/get-current-user.service/get-current-user.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TaskState } from '../../services/task-manager.service/task-manager.service';

@Component({
  selector: 'app-projects',
  standalone: false,
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss'],
})
export class ProjectsComponent implements OnInit {
  user: any;
  projects: Project[] = [];
  isLoading = true;
  error: string | null = null;

  constructor(
    private projectService: ProjectManagerService,
    private getCurrentUser: GetCurrentUserService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.getCurrentUser.getCurrentUser().subscribe({
      next: (data) => {
        this.user = data;
        if (this.user?.email && typeof this.user.email === 'string') {
          this.fetchProjects(this.user.email);
        } else {
          this.error = 'User email not found';
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Error fetching current user:', error);
        this.snackBar.open('Failed to load user data', 'Close', {
          duration: 3000,
        });
        this.isLoading = false;
      },
    });
  }

  private fetchProjects(email: string): void {
    this.projectService.getProjects(email).subscribe({
      next: (projects) => {
        this.projects = projects.map((project) => {
          const totalTasks = project.projectTasks.length;
          const completedTasks = project.projectTasks.filter(
            (task: any) => task.taskCompletionState === TaskState.Done
          ).length;

          return {
            ...project,
            createdAt: new Date(project.createdAt),
            totalTasksCreated: totalTasks,
            totalTasksCompleted: completedTasks,
            completionRate: 0, // will be animated later
          };
        });

        this.animateProgress();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching projects:', err);
        this.error = 'Failed to load projects';
        this.isLoading = false;
      },
    });
  }

  private animateProgress(): void {
    const steps = 100;
    let step = 0;

    const interval = setInterval(() => {
      step++;

      this.projects.forEach((project) => {
        const total = project.totalTasksCreated ?? 0;
        const completed = project.totalTasksCompleted ?? 0;

        if (total > 0) {
          const fullCompletionRate = (completed / total) * 100;
          project.completionRate = Math.min(
            fullCompletionRate,
            (step / steps) * fullCompletionRate
          );
        } else {
          project.completionRate = 0;
        }
      });

      if (step >= steps) {
        clearInterval(interval);
      }
    }, 20);
  }
}
