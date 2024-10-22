provider "aws" {
  region = "us-east-1"
}

terraform {
    required_providers {
        aws = {
            source  = "hashicorp/aws"
            version = "~> 5.0"
        }
    }
    backend "s3" {
        bucket = "clash-terraform-state"
        key = "website/terraform.tfstate"
    }
}

data "aws_vpc" "default_vpc" {
  filter {
    name = "tag:Name"
    values = ["default-vpc"]
  }
}

data "aws_subnets" "public_subets" {
  filter {
    name   = "tag:Name"
    values = ["*public*"]  # This will match any subnet with "public" in its name
  }
}

resource "aws_security_group" "ecs_sg" {
  name        = "ecs-sg"
  description = "Allow inbound access to ECS tasks"
  vpc_id      = data.aws_vpc.default_vpc.id

  ingress {
    protocol    = "tcp"
    from_port   = 80
    to_port     = 80
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_ecr_repository" "clash_website_repo" {
  name = "clash_website_repo"
}

resource "aws_ecr_lifecycle_policy" "clash_website_ecr_policy" {
  repository = aws_ecr_repository.clash_website_repo.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 2 images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 2
      }
      action = {
        type = "expire"
      }
    }]
  })
}

resource "aws_ecs_cluster" "clash_website_cluster" {
  name = "clash_website_cluster"
}

data "aws_iam_role" "ecs_task_execution_role" {
    name = "ecs_execution_role"
}

# ECS Task Definition
resource "aws_ecs_task_definition" "clash_website_task_definition" {
  family                   = "service"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn = data.aws_iam_role.ecs_task_execution_role.arn
  container_definitions = jsonencode([
    {
      name  = "clash_website_task_definition"
      image = "${aws_ecr_repository.clash_website_repo.repository_url}:latest"
      portMappings = [
        {
          containerPort = 80
          hostPort      = 80
        }
      ]
    }
  ])
}

# ECS Service
resource "aws_ecs_service" "clash_website_service" {
  name            = "clash_website_service"
  cluster         = aws_ecs_cluster.clash_website_cluster.id
  task_definition = aws_ecs_task_definition.clash_website_task_definition.arn
  launch_type     = "FARGATE"
  desired_count   = 1

  network_configuration {
    subnets          = data.aws_subnets.ids
    assign_public_ip = true
    security_groups  = [aws_security_group.ecs_sg.id]
  }
}
