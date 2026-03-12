package com.example.formBuilder.entity;

import lombok.*;
import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TeamMemberId implements Serializable {
    private Long teamId;
    private Long userId;
}
