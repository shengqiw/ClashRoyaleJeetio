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

data "aws_subnets" "public_subnets" {
  filter {
    name   = "tag:Name"
    values = ["*public*"]  # This will match any subnet with "public" in its name
  }
}

resource "aws_security_group" "alb_sg" {
  name        = "alb-sg"
  description = "Allow inbound access to ECS tasks"
  vpc_id      = data.aws_vpc.default_vpc.id

  ingress {
    protocol    = "tcp"
    from_port   = 80
    to_port     = 80
    cidr_blocks = ["0.0.0.0/0"]
  }
   ingress {
    protocol    = "tcp"
    from_port   = 443
    to_port     = 443
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    protocol    = "-1"
    from_port   = 0
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "fargate_sg" {
  name        = "fargate-sg"
  description = "Allow inbound access to ECS tasks"
  vpc_id      = data.aws_vpc.default_vpc.id

  ingress {
    protocol    = "tcp"
    from_port   = 8080
    to_port     = 8080
    security_groups = [aws_security_group.alb_sg.id]
  }
  egress {
    protocol    = "-1"
    from_port   = 0
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
  }
}
data "aws_acm_certificate" "jeetio_certificate" {
  domain = "jeetio.com"
  statuses = ["ISSUED"]
  most_recent = true
}

data "aws_route53_zone" "clash_website_zone" {
  name = "jeetio.com"
}

resource "aws_lb" "clash_website_lb" {
  name               = "clash-website-lb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = data.aws_subnets.public_subnets.ids
}

resource "aws_lb_target_group" "clash_website_tg" {
  name     = "clash-website-tg"
  port     = 8080
  protocol = "HTTP"
  target_type = "ip"
  vpc_id   = data.aws_vpc.default_vpc.id

  health_check {
    path                = "/"
    protocol            = "HTTP"
    timeout             = 60
    interval            = 120
    healthy_threshold   = 2
    unhealthy_threshold = 2
  }
}

resource "aws_lb_listener" "clash_website_listener" {
  load_balancer_arn = aws_lb.clash_website_lb.arn
  port              = "443"
  protocol          = "HTTPS"
  certificate_arn = data.aws_acm_certificate.jeetio_certificate.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.clash_website_tg.arn
  }
}

resource "aws_lb_listener" "http_listener" {
  load_balancer_arn = aws_lb.clash_website_lb.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

resource "aws_route53_record" "clash_website_record" {
  zone_id = data.aws_route53_zone.clash_website_zone.zone_id
  name    = "clash-website-jeetio"
  type    = "A"

  alias {
    name                   = aws_lb.clash_website_lb.dns_name
    zone_id                = aws_lb.clash_website_lb.zone_id
    evaluate_target_health = true
  }
}

resource "aws_cloudwatch_log_group" "clash_website_lg" {
  name = "clash_website_lg"
  retention_in_days = 60
  tags = {
    Name = "clash_website_lg"
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

data "aws_iam_role" "ecs_execution_role" {
    name = "ecs-execution-role"
}

data "aws_iam_role" "ecs_task_role" {
    name = "ecs-task-role"
}

# ECS Task Definition
resource "aws_ecs_task_definition" "clash_website_task_definition" {
  family                   = "service"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = data.aws_iam_role.ecs_execution_role.arn
  task_role_arn            = data.aws_iam_role.ecs_task_role.arn
  container_definitions    = jsonencode([
    {
      name  = "clash_website_ecs"
      image = "${aws_ecr_repository.clash_website_repo.repository_url}:latest"
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group" = aws_cloudwatch_log_group.clash_website_lg.name
          "awslogs-region" = "us-east-1"
          "awslogs-stream-prefix" = "clash_website"
        }
      }
      portMappings = [
        {
          containerPort = 8080
          hostPort      = 8080
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
    subnets          = data.aws_subnets.public_subnets.ids
    assign_public_ip = true
    security_groups  = [aws_security_group.fargate_sg.id]
  }
  load_balancer {
    target_group_arn = aws_lb_target_group.clash_website_tg.arn
    container_name   = "clash_website_ecs"
    container_port   = 8080
  }
}
