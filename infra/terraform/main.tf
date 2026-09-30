resource "aws_security_group" "taskflow_sg" {
  name        = "taskflow-sg"
  description = "Security group allowing taskflow port 8080"

  ingress {
    description = "Allow port 8080 traffic"
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"] # หลีกเลี่ยง 0.0.0.0/0 เพื่อแก้ security finding ของ tfsec/Checkov
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["10.0.0.0/16"]
  }
}

resource "aws_instance" "taskflow_vm" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t2.micro"

  vpc_security_group_ids = [aws_security_group.taskflow_sg.id]

  # เพิ่ม root block encryption แก้ checkov finding
  root_block_device {
    encrypted = true
  }

  tags = {
    Name = "taskflow-api-host"
  }
}

output "instance_ip" {
  description = "Public IP address of the compute instance"
  value       = aws_instance.taskflow_vm.public_ip
}
