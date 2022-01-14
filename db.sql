CREATE TABLE  IF NOT EXISTS `admins` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(45) NOT NULL,
  `password` varchar(100) NOT NULL,
  `fullName` varchar(45) NOT NULL,
  `JWTToken` varchar(300) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

CREATE TABLE  IF NOT EXISTS `users` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `fullName` varchar(45) NOT NULL,
    `email` varchar(45) NOT NULL,
    `loginPin` varchar(45) NOT NULL,
    `JWTToken` varchar(300) DEFAULT NULL,
    `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
);
