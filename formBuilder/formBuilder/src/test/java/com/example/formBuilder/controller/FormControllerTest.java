package com.example.formBuilder.controller;

import com.example.formBuilder.constants.AppConstants;
import com.example.formBuilder.dto.*;
import com.example.formBuilder.entity.Form;
import com.example.formBuilder.enums.FormStatus;
import com.example.formBuilder.exception.ResourceNotFoundException;
import com.example.formBuilder.exception.ValidationException;
import com.example.formBuilder.service.FormService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(FormController.class)
@AutoConfigureMockMvc(addFilters = false)
public class FormControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private FormService formService;

    @Autowired
    private ObjectMapper objectMapper;

    private Form form;
    private FormListDto formListDto;

    @BeforeEach
    void setUp() {
        form = new Form();
        form.setId(1L);
        form.setFormName("Test Form");
        form.setStatus(FormStatus.DRAFT);

        formListDto = new FormListDto(1L, "Test Form", FormStatus.DRAFT);
    }

    @Test
    void getAllForms_ShouldReturnList() throws Exception {
        when(formService.getAllForms()).thenReturn(List.of(formListDto));

        mockMvc.perform(get(AppConstants.API_BASE_FORMS))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].formName").value("Test Form"));
    }

    @Test
    void createForm_ShouldReturnSuccess() throws Exception {
        FormRequest req = new FormRequest();
        req.setFormName("New Form");
        
        when(formService.createForm(any(FormRequest.class))).thenReturn("Form Created Successfully");

        mockMvc.perform(post(AppConstants.API_BASE_FORMS)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Form Created Successfully"));
    }

    @Test
    void getForm_ShouldReturnForm() throws Exception {
        when(formService.getFormById(1L)).thenReturn(form);

        mockMvc.perform(get(AppConstants.API_BASE_FORMS + "/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(1));
    }

    @Test
    void getFormData_ShouldReturnPagedData() throws Exception {
        Map<String, Object> mockResponse = new HashMap<>();
        mockResponse.put("content", new ArrayList<>());
        mockResponse.put("totalElements", 0);
        
        when(formService.getAllDataFromTable(eq(1L), anyInt(), anyInt(), anyString(), anyString()))
                .thenReturn(mockResponse);

        mockMvc.perform(get(AppConstants.API_BASE_FORMS + "/1/data"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalElements").value(0));
    }

    @Test
    void publishForm_ShouldReturnSuccess() throws Exception {
        when(formService.publishForm(1L)).thenReturn("Form Published Successfully");

        mockMvc.perform(post(AppConstants.API_BASE_FORMS + "/publish/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Form Published Successfully"));
    }

    @Test
    void getLookupValues_ShouldReturnList() throws Exception {
        Map<String, Object> val1 = new HashMap<>();
        val1.put("id", 1L);
        val1.put("value", "Value1");
        Map<String, Object> val2 = new HashMap<>();
        val2.put("id", 2L);
        val2.put("value", "Value2");
        
        when(formService.getLookupValues(1L, "name")).thenReturn(List.of(val1, val2));

        mockMvc.perform(get(AppConstants.API_BASE_FORMS + "/1/lookup/name"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0]").value("Value1"));
    }

    @Test
    void updateForm_ShouldReturnSuccess() throws Exception {
        UpdateFormRequest req = new UpdateFormRequest();
        req.setFormName("Updated Name");

        when(formService.updateForm(eq(1L), any(UpdateFormRequest.class))).thenReturn("Form updated successfully");

        mockMvc.perform(put(AppConstants.API_BASE_FORMS + "/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Form updated successfully"));
    }

    @Test
    void getFormRules_ShouldReturnRules() throws Exception {
        when(formService.getFormRules(1L)).thenReturn("[]");

        mockMvc.perform(get(AppConstants.API_BASE_FORMS + "/1/rules"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").value("[]"));
    }

    @Test
    void saveFormRules_ShouldReturnSuccess() throws Exception {
        List<FormRuleDTO> rules = new ArrayList<>();
        
        when(formService.saveFormRules(eq(1L), anyList())).thenReturn("Rules saved successfully");

        mockMvc.perform(post(AppConstants.API_BASE_FORMS + "/1/rules")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rules)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Rules saved successfully"));
    }

    @Test
    void getForm_NotFound_ShouldReturn404() throws Exception {
        when(formService.getFormById(99L)).thenThrow(new ResourceNotFoundException("Form not found"));

        mockMvc.perform(get(AppConstants.API_BASE_FORMS + "/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Form not found"));
    }

    @Test
    void createForm_ValidationError_ShouldReturn400() throws Exception {
        FormRequest req = new FormRequest();
        when(formService.createForm(any(FormRequest.class))).thenThrow(new ValidationException("Invalid form"));

        mockMvc.perform(post(AppConstants.API_BASE_FORMS)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Invalid form"));
    }

    @Test
    void getLookupValues_InvalidColumn_ShouldReturn400() throws Exception {
        when(formService.getLookupValues(eq(1L), anyString())).thenThrow(new IllegalArgumentException("Invalid column name"));

        mockMvc.perform(get(AppConstants.API_BASE_FORMS + "/1/lookup/drop;table"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Invalid column name"));
    }
}
